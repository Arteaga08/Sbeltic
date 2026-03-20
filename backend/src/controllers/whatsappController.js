/**
 * WhatsApp Conversational State Machine
 *
 * Captura pacientes nuevos y agenda/registra citas directamente desde WhatsApp.
 *
 * Flujos:
 *   A) Agendar  → categoría → tratamiento → slots → nombre → LEAD + Appointment PENDING
 *   B) Cotizar  → categoría → tratamiento → slots → nombre → LEAD + Appointment PENDING + link historial
 *   C) Asesor   → transferencia a humano (bot se pausa)
 *
 * Variables de entorno requeridas:
 *   BOT_RECEPTIONIST_ID — ObjectId del User que maneja citas spa/láser
 *   BOT_DOCTOR_ID       — ObjectId del User que maneja citas médicas/cotizaciones
 */

import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import TimeBlock from "../models/TimeBlock.js";
import Patient from "../models/clinical/Patient.js";
import Treatment from "../models/clinical/Treatment.js";
import TreatmentCategory from "../models/clinical/TreatmentCategory.js";
import { generateSignatureToken } from "./publicController.js";
import {
  sendWhatsAppInteractive,
  sendWhatsAppList,
  sendWhatsAppMessage,
} from "../services/whatsappService.js";

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------
const sessions = new Map();

// ---------------------------------------------------------------------------
// Catálogo de categorías — dinámico desde TreatmentCategory en DB
// Los tratamientos dentro de cada categoría también se cargan desde la DB
// ---------------------------------------------------------------------------
let _agendarCatCache = null;
let _cotizarCatCache = null;
let _catCacheExpiresAt = 0;

const _mapCat = (c, i) => ({
  id: `CAT_${c.slug}`,
  label: c.name,
  roomId: c.roomIds?.[0], // bot usa la primera sala de la lista
  treatmentCategory: c.slug, // coincide con Treatment.category en DB
});

const getAgendarCategories = async () => {
  if (Date.now() < _catCacheExpiresAt && _agendarCatCache) return _agendarCatCache;
  await _refreshCatCache();
  return _agendarCatCache;
};

const getCotizarCategories = async () => {
  if (Date.now() < _catCacheExpiresAt && _cotizarCatCache) return _cotizarCatCache;
  await _refreshCatCache();
  return _cotizarCatCache;
};

const _refreshCatCache = async () => {
  const [agendar, cotizar] = await Promise.all([
    TreatmentCategory.find({ botFlow: { $in: ["AGENDAR", "BOTH"] }, isActive: true }).sort({ name: 1 }),
    TreatmentCategory.find({ botFlow: { $in: ["COTIZAR", "BOTH"] }, isActive: true }).sort({ name: 1 }),
  ]);
  _agendarCatCache = agendar.map(_mapCat);
  _cotizarCatCache = cotizar.map(_mapCat);
  _catCacheExpiresAt = Date.now() + 5 * 60 * 1000;
};

// ---------------------------------------------------------------------------
// Utilidades de formato de fecha
// ---------------------------------------------------------------------------
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatSlotId = (date) => `SLOT_${date.getTime()}`;

const formatSlotTitle = (date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${DIAS[date.getDay()]} ${date.getDate()} ${MESES[date.getMonth()]} • ${h}:${m}`;
};

const formatSlotFull = (date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${DIAS[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]} a las ${h}:${m}`;
};

// ---------------------------------------------------------------------------
// Disponibilidad de horarios
// ---------------------------------------------------------------------------
const getAvailableSlots = async (performerId, roomId, daysAhead = 7, slotDuration = 30) => {
  if (!mongoose.Types.ObjectId.isValid(performerId)) {
    console.error("❌ [WA-BOT] performerId inválido:", performerId);
    return [];
  }

  const available = [];
  const now = new Date();
  const perfId = new mongoose.Types.ObjectId(performerId);
  const botIds = [process.env.BOT_RECEPTIONIST_ID, process.env.BOT_DOCTOR_ID].filter(Boolean);
  const isBotUser = botIds.includes(String(performerId));

  for (let d = 0; d < daysAhead && available.length < 10; d++) {
    const day = new Date();
    day.setDate(day.getDate() + d);
    if (day.getDay() === 0) continue; // Cerrado domingos

    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    // Para bots: solo checar colisión por room (son usuarios virtuales, no personas reales)
    const appointmentFilter = isBotUser
      ? { roomId, appointmentDate: { $gte: dayStart, $lte: dayEnd }, status: { $nin: ["CANCELLED"] } }
      : { $or: [{ doctorId: perfId }, { roomId }], appointmentDate: { $gte: dayStart, $lte: dayEnd }, status: { $nin: ["CANCELLED"] } };

    const [appointments, blocks] = await Promise.all([
      Appointment.find(appointmentFilter),
      TimeBlock.find({
        doctorId: perfId,
        startTime: { $lte: dayEnd },
        endTime: { $gte: dayStart },
        isActive: true,
      }),
    ]);

    for (let h = 9; h < 18 && available.length < 10; h++) {
      for (let min = 0; min < 60 && available.length < 10; min += slotDuration) {
        const slotStart = new Date(day);
        slotStart.setHours(h, min, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        if (slotStart <= now) continue;

        const conflict =
          appointments.some((a) => {
            const aEnd = new Date(a.appointmentDate.getTime() + a.duration * 60000);
            return slotStart < aEnd && slotEnd > a.appointmentDate;
          }) || blocks.some((b) => slotStart < b.endTime && slotEnd > b.startTime);

        if (!conflict) available.push(slotStart);
      }
    }
  }

  return available;
};

const slotsToListSection = (slots, duration = 30) => ({
  title: "Horarios disponibles",
  rows: slots.map((s) => ({
    id: formatSlotId(s),
    title: formatSlotTitle(s),
    description: `${duration} min · disponible`,
  })),
});

// ---------------------------------------------------------------------------
// Helpers de BD
// ---------------------------------------------------------------------------
const findOrCreateLead = async (name, phone) => {
  const existing = await Patient.findOne({ phone: { $regex: phone.slice(-10) } });
  if (existing) return { patient: existing, isNew: false };

  const safeName = name.trim() || "LEAD";
  const firstName = safeName.split(" ")[0].toUpperCase();
  const referralCode = `${firstName}-${Math.floor(1000 + Math.random() * 9000)}`;

  const patient = await Patient.create({
    name: safeName,
    phone,
    patientType: "LEAD",
    referralCode,
    isProfileComplete: false,
  });
  return { patient, isNew: true };
};

const createAppointment = async (
  patientId,
  performerId,
  roomId,
  slotDate,
  treatmentName,
  treatmentCategory,
  treatmentId = null,
  duration = 30,
) => {
  const doctorObjectId = new mongoose.Types.ObjectId(performerId);
  return Appointment.create({
    patientId,
    doctorId: doctorObjectId,
    roomId,
    appointmentDate: slotDate,
    duration,
    treatmentId: treatmentId ? new mongoose.Types.ObjectId(treatmentId) : undefined,
    treatmentName,
    treatmentCategory,
    status: "PENDING",
    createdBy: doctorObjectId,
  });
};

/**
 * Carga treatments activos de una categoría para mostrar como sub-categorías.
 * Retorna array vacío si no hay treatments, en cuyo caso el flujo salta directo a slots.
 */
const getTreatmentsByCategory = async (treatmentCategory) => {
  return Treatment.find({ category: treatmentCategory, isActive: true })
    .select("_id name estimatedDuration")
    .sort({ name: 1 });
};

// ---------------------------------------------------------------------------
// Parser de mensajes entrantes
// ---------------------------------------------------------------------------
const parseIncoming = (msg) => {
  if (msg.type === "text") {
    return { kind: "text", value: msg.text?.body?.trim() ?? "" };
  }
  if (msg.type === "interactive") {
    if (msg.interactive.type === "button_reply") {
      return { kind: "button", value: msg.interactive.button_reply.id };
    }
    if (msg.interactive.type === "list_reply") {
      return { kind: "list", value: msg.interactive.list_reply.id };
    }
  }
  return { kind: "unknown", value: "" };
};

// ---------------------------------------------------------------------------
// Helpers de flujo compartidos
// ---------------------------------------------------------------------------

/**
 * Muestra los slots disponibles para una categoría ya seleccionada.
 * Usado tanto en el paso de categoría (si no hay treatments) como en el
 * paso de tratamiento (después de elegir uno).
 */
const showSlots = async (phone, performerId, session, nextState, slotDuration = 30) => {
  const slots = await getAvailableSlots(performerId, session.roomId, 7, slotDuration);

  if (slots.length === 0) {
    await sendWhatsAppMessage(
      phone,
      `Lo sentimos, no hay horarios disponibles esta semana para *${session.categoryLabel}*. Un asesor te contactará pronto para ayudarte. 🙏`,
    );
    sessions.delete(phone);
    return;
  }

  sessions.set(phone, { ...session, state: nextState, slotDuration });
  await sendWhatsAppList(
    phone,
    `Estos son los horarios disponibles para *${session.treatmentName || session.categoryLabel}*. ¿Cuál te queda mejor?`,
    "Ver horarios",
    [slotsToListSection(slots, slotDuration)],
  );
};

// ---------------------------------------------------------------------------
// Handlers de estado
// ---------------------------------------------------------------------------

const handleNoSession = async (phone) => {
  sessions.set(phone, { state: "MENU_SENT" });
  await sendWhatsAppInteractive(
    phone,
    "¡Hola! Soy el asistente virtual de Sbeltic 🌿\n\n¿En qué te puedo ayudar hoy?",
    [
      { id: "BTN_AGENDAR", title: "Agendar" },
      { id: "BTN_COTIZAR", title: "Cotizar" },
      { id: "BTN_ASESOR", title: "Asesor" },
    ],
  );
  return true;
};

const handleMenuSent = async (phone, parsed) => {
  switch (parsed.value) {
    case "BTN_AGENDAR": {
      const agendarCats = await getAgendarCategories();
      if (agendarCats.length === 0) {
        await sendWhatsAppMessage(phone, "Lo sentimos, no hay servicios disponibles en este momento. Un asesor te contactará pronto. 🙏");
        sessions.delete(phone);
        break;
      }
      sessions.set(phone, { state: "AGENDANDO_PIDIENDO_CATEGORIA" });
      await sendWhatsAppList(
        phone,
        "¿Qué tipo de servicio te interesa? Selecciona una categoría:",
        "Ver categorías",
        [{ title: "Servicios disponibles", rows: agendarCats.map((c) => ({ id: c.id, title: c.label })) }],
      );
      break;
    }

    case "BTN_COTIZAR": {
      const cotizarCats = await getCotizarCategories();
      if (cotizarCats.length === 0) {
        await sendWhatsAppMessage(phone, "Lo sentimos, no hay procedimientos disponibles en este momento. Un asesor te contactará pronto. 🙏");
        sessions.delete(phone);
        break;
      }
      sessions.set(phone, { state: "COTIZANDO_PIDIENDO_CATEGORIA" });
      await sendWhatsAppList(
        phone,
        "¿Qué procedimiento te interesa cotizar? Selecciona una categoría:",
        "Ver categorías",
        [{ title: "Procedimientos médicos", rows: cotizarCats.map((c) => ({ id: c.id, title: c.label })) }],
      );
      break;
    }

    case "BTN_ASESOR":
      sessions.set(phone, { state: "HUMAN_TAKEOVER" });
      await sendWhatsAppMessage(
        phone,
        "Te estoy transfiriendo con uno de nuestros especialistas. En un momento te atenderán personalmente. 🕒",
      );
      break;

    default:
      await handleNoSession(phone);
      break;
  }
  return true;
};

// --- RAMA AGENDAR ---

const handleAgendandoCategoria = async (phone, parsed) => {
  if (parsed.kind !== "list") {
    await sendWhatsAppMessage(phone, "Por favor selecciona una categoría del menú anterior.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const cats = await getAgendarCategories();
  const cat = cats.find((c) => c.id === parsed.value);
  if (!cat) {
    await sendWhatsAppMessage(phone, "No reconocí esa opción. Por favor intenta de nuevo.");
    return true;
  }

  const performerId = process.env.BOT_RECEPTIONIST_ID;
  if (!performerId) {
    console.error("❌ [WA-BOT] BOT_RECEPTIONIST_ID no configurado en .env");
    await sendWhatsAppMessage(phone, "Ocurrió un error interno. Por favor contacta a recepción directamente. 🙏");
    sessions.delete(phone);
    return true;
  }

  const baseSession = {
    categoryId: cat.id,
    categoryLabel: cat.label,
    roomId: cat.roomId,
    treatmentCategory: cat.treatmentCategory,
  };

  // Cargar treatments de esta categoría desde la API
  const treatments = await getTreatmentsByCategory(cat.treatmentCategory);

  if (treatments.length > 0) {
    // Hay treatments — pedir al paciente que elija uno
    sessions.set(phone, { ...baseSession, state: "AGENDANDO_ELIGIENDO_TRATAMIENTO" });
    await sendWhatsAppList(
      phone,
      `¿Qué tratamiento de *${cat.label}* te interesa?`,
      "Ver tratamientos",
      [
        {
          title: cat.label,
          rows: treatments.map((t) => ({
            id: `TREAT_${t._id}`,
            title: t.name.length > 24 ? t.name.substring(0, 24) : t.name,
            description: `${t.estimatedDuration} min`,
          })),
        },
      ],
    );
  } else {
    // Sin treatments registrados — ir directo a slots con duración default (30 min)
    await showSlots(phone, performerId, { ...baseSession, treatmentName: cat.label }, "AGENDANDO_MOSTRANDO_SLOTS");
  }

  return true;
};

const handleAgendandoTratamiento = async (phone, parsed, session) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("TREAT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un tratamiento del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const treatmentId = parsed.value.replace("TREAT_", "");
  const treatment = await Treatment.findById(treatmentId).select("name estimatedDuration");

  if (!treatment) {
    await sendWhatsAppMessage(phone, "No encontré ese tratamiento. Por favor intenta de nuevo.");
    return true;
  }

  const performerId = process.env.BOT_RECEPTIONIST_ID;
  const updatedSession = {
    ...session,
    treatmentId: String(treatment._id),
    treatmentName: treatment.name,
    slotDuration: treatment.estimatedDuration || 30,
  };

  await showSlots(phone, performerId, updatedSession, "AGENDANDO_MOSTRANDO_SLOTS", updatedSession.slotDuration);
  return true;
};

const handleAgendandoSlot = async (phone, parsed) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("SLOT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un horario del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const slotDate = new Date(parseInt(parsed.value.replace("SLOT_", ""), 10));
  const session = sessions.get(phone);

  sessions.set(phone, { ...session, state: "AGENDANDO_PIDIENDO_NOMBRE", slotDate });

  await sendWhatsAppMessage(
    phone,
    `¡Perfecto! Tienes seleccionado el *${formatSlotFull(slotDate)}* para *${session.treatmentName || session.categoryLabel}*. 🗓️\n\n¿Me puedes dar tu nombre completo para registrarte?`,
  );
  return true;
};

const handleAgendandoNombre = async (phone, parsed, session) => {
  if (parsed.kind !== "text" || !parsed.value) {
    await sendWhatsAppMessage(phone, "Por favor escríbeme tu nombre completo para continuar.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const nombre = parsed.value;
  const { patient } = await findOrCreateLead(nombre, phone);

  try {
    await createAppointment(
      patient._id,
      process.env.BOT_RECEPTIONIST_ID,
      session.roomId,
      session.slotDate,
      session.treatmentName || session.categoryLabel,
      session.treatmentCategory,
      session.treatmentId || null,
      session.slotDuration || 30,
    );
  } catch (err) {
    console.error("❌ [WA-BOT] Colisión al crear cita:", err.message);
    await sendWhatsAppMessage(
      phone,
      "Lo sentimos, ese horario ya no está disponible 😔. Escríbenos de nuevo para elegir otro. Un asesor también te puede ayudar.",
    );
    sessions.delete(phone);
    return true;
  }

  sessions.delete(phone);

  await sendWhatsAppMessage(
    phone,
    `¡Muchas gracias, *${nombre}*! 🙏 Tu cita para *${session.treatmentName || session.categoryLabel}* el *${formatSlotFull(session.slotDate)}* ha sido registrada con éxito ✅.\n\nEn breve un asesor confirmará tu cita. ¡Te esperamos en Sbeltic!`,
  );
  return true;
};

// --- RAMA COTIZAR ---

const handleCotizandoCategoria = async (phone, parsed) => {
  if (parsed.kind !== "list") {
    await sendWhatsAppMessage(phone, "Por favor selecciona una categoría del menú anterior.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const cats = await getCotizarCategories();
  const cat = cats.find((c) => c.id === parsed.value);
  if (!cat) {
    await sendWhatsAppMessage(phone, "No reconocí esa opción. Por favor intenta de nuevo.");
    return true;
  }

  const performerId = process.env.BOT_DOCTOR_ID;
  if (!performerId) {
    console.error("❌ [WA-BOT] BOT_DOCTOR_ID no configurado en .env");
    await sendWhatsAppMessage(phone, "Ocurrió un error interno. Por favor contacta a recepción directamente. 🙏");
    sessions.delete(phone);
    return true;
  }

  const baseSession = {
    categoryId: cat.id,
    categoryLabel: cat.label,
    roomId: cat.roomId,
    treatmentCategory: cat.treatmentCategory,
  };

  // Cargar treatments de esta categoría desde la API
  const treatments = await getTreatmentsByCategory(cat.treatmentCategory);

  if (treatments.length > 0) {
    sessions.set(phone, { ...baseSession, state: "COTIZANDO_ELIGIENDO_TRATAMIENTO" });
    await sendWhatsAppList(
      phone,
      `¿Qué procedimiento de *${cat.label}* te interesa cotizar?`,
      "Ver procedimientos",
      [
        {
          title: cat.label,
          rows: treatments.map((t) => ({
            id: `TREAT_${t._id}`,
            title: t.name.length > 24 ? t.name.substring(0, 24) : t.name,
            description: `${t.estimatedDuration} min`,
          })),
        },
      ],
    );
  } else {
    await showSlots(phone, performerId, { ...baseSession, treatmentName: cat.label }, "COTIZANDO_MOSTRANDO_SLOTS");
  }

  return true;
};

const handleCotizandoTratamiento = async (phone, parsed, session) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("TREAT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un procedimiento del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const treatmentId = parsed.value.replace("TREAT_", "");
  const treatment = await Treatment.findById(treatmentId).select("name estimatedDuration");

  if (!treatment) {
    await sendWhatsAppMessage(phone, "No encontré ese procedimiento. Por favor intenta de nuevo.");
    return true;
  }

  const performerId = process.env.BOT_DOCTOR_ID;
  const updatedSession = {
    ...session,
    treatmentId: String(treatment._id),
    treatmentName: treatment.name,
    slotDuration: treatment.estimatedDuration || 30,
  };

  await showSlots(phone, performerId, updatedSession, "COTIZANDO_MOSTRANDO_SLOTS", updatedSession.slotDuration);
  return true;
};

const handleCotizandoSlot = async (phone, parsed) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("SLOT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un horario del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const slotDate = new Date(parseInt(parsed.value.replace("SLOT_", ""), 10));
  const session = sessions.get(phone);

  sessions.set(phone, { ...session, state: "COTIZANDO_PIDIENDO_NOMBRE", slotDate });

  await sendWhatsAppMessage(
    phone,
    `¡Excelente! Tienes seleccionado el *${formatSlotFull(slotDate)}* para *${session.treatmentName || session.categoryLabel}*. 🗓️\n\n¿Me puedes dar tu nombre completo para registrarte?`,
  );
  return true;
};

const handleCotizandoNombre = async (phone, parsed, session) => {
  if (parsed.kind !== "text" || !parsed.value) {
    await sendWhatsAppMessage(phone, "Por favor escríbeme tu nombre completo para continuar.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const nombre = parsed.value;
  const { patient } = await findOrCreateLead(nombre, phone);

  // Crear cita tentativa
  try {
    await createAppointment(
      patient._id,
      process.env.BOT_DOCTOR_ID,
      session.roomId,
      session.slotDate,
      session.treatmentName || session.categoryLabel,
      session.treatmentCategory,
      session.treatmentId || null,
      session.slotDuration || 30,
    );
  } catch (err) {
    console.error("❌ [WA-BOT] Colisión al crear cita cotizar:", err.message);
    await sendWhatsAppMessage(
      phone,
      "Lo sentimos, ese horario ya no está disponible 😔. Escríbenos de nuevo para elegir otro.",
    );
    sessions.delete(phone);
    return true;
  }

  // Generar link a formulario de historial médico (24h de expiración)
  console.log("📋 [WA-BOT] Generando token historial para paciente:", patient._id);
  const token = await generateSignatureToken(
    patient._id,
    String(patient._id),
    "MEDICAL_HISTORY_FORM",
    24,
  );
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const link = `${baseUrl}/paciente/historial/${token}`;

  sessions.delete(phone);

  await sendWhatsAppMessage(
    phone,
    `¡Gracias, *${nombre}*! 🙏 Tu cita tentativa para *${session.treatmentName || session.categoryLabel}* el *${formatSlotFull(session.slotDate)}* está reservada ✅.\n\nAntes de confirmarla, necesitamos tu historial médico:\n\n${link}\n\nUn médico revisará tu caso al terminar. ¡El link expira en 24 horas!`,
  );
  return true;
};

// ---------------------------------------------------------------------------
// Función principal exportada
// ---------------------------------------------------------------------------

/**
 * Procesa un mensaje entrante a través de la máquina de estados.
 * @returns {boolean} true si el mensaje fue manejado, false si no (ej. HUMAN_TAKEOVER)
 */
export const handleStateMachine = async (msg, phone) => {
  const parsed = parseIncoming(msg);
  if (parsed.kind === "unknown") return false;

  const session = sessions.get(phone);
  const state = session?.state ?? null;

  console.log(
    `🤖 [WA-BOT] ${phone} | state: ${state ?? "null"} | kind: ${parsed.kind} | value: ${parsed.value}`,
  );

  // Bot en pausa — asesor humano está atendiendo
  if (state === "HUMAN_TAKEOVER") return false;

  // Palabra clave de regreso: reinicia la sesión y vuelve al menú principal
  const isBackKeyword =
    parsed.kind === "text" &&
    /^(menu|menú|volver|inicio|cancelar|0)$/i.test(
      parsed.value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    );
  if (isBackKeyword && sessions.has(phone)) {
    sessions.delete(phone);
    return handleNoSession(phone);
  }

  switch (state) {
    case null:
      return handleNoSession(phone);

    case "MENU_SENT":
      return handleMenuSent(phone, parsed);

    case "AGENDANDO_PIDIENDO_CATEGORIA":
      return handleAgendandoCategoria(phone, parsed);

    case "AGENDANDO_ELIGIENDO_TRATAMIENTO":
      return handleAgendandoTratamiento(phone, parsed, session);

    case "AGENDANDO_MOSTRANDO_SLOTS":
      return handleAgendandoSlot(phone, parsed);

    case "AGENDANDO_PIDIENDO_NOMBRE":
      return handleAgendandoNombre(phone, parsed, session);

    case "COTIZANDO_PIDIENDO_CATEGORIA":
      return handleCotizandoCategoria(phone, parsed);

    case "COTIZANDO_ELIGIENDO_TRATAMIENTO":
      return handleCotizandoTratamiento(phone, parsed, session);

    case "COTIZANDO_MOSTRANDO_SLOTS":
      return handleCotizandoSlot(phone, parsed);

    case "COTIZANDO_PIDIENDO_NOMBRE":
      return handleCotizandoNombre(phone, parsed, session);

    default:
      console.warn(`⚠️ [WA-BOT] Estado desconocido "${state}" para ${phone}. Reiniciando.`);
      sessions.delete(phone);
      return handleNoSession(phone);
  }
};

/**
 * Indica si el número tiene una sesión activa en el bot.
 * Usado por webhookController para enrutar antes de la lógica legacy.
 */
export const hasActiveSession = (phone) => sessions.has(phone);
