/**
 * WhatsApp Conversational State Machine
 *
 * Captura pacientes nuevos y agenda/registra citas directamente desde WhatsApp.
 *
 * Flujos:
 *   A) Agendar  → categoría → tratamiento → slots → nombre → LEAD + Appointment PENDING
 *   B) Consulta → tratamiento → slots → nombre+edad → LEAD + Appointment PENDING + historial link + firma link + gracias
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
import Waitlist from "../models/clinical/Waitlist.js";
import { generateSignatureToken } from "./publicController.js";
import {
  sendWhatsAppInteractive,
  sendWhatsAppList,
  sendWhatsAppMessage,
} from "../services/whatsappService.js";
import { getActiveReceptionists, RECEPTIONIST_ROOMS } from "../services/availabilityService.js";

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------
const sessions = new Map();

// ---------------------------------------------------------------------------
// Catálogo de categorías — dinámico desde TreatmentCategory en DB
// Los tratamientos dentro de cada categoría también se cargan desde la DB
// ---------------------------------------------------------------------------
let _agendarCatCache = null;
let _consultaCatCache = null;
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

const getConsultaCategories = async () => {
  if (Date.now() < _catCacheExpiresAt && _consultaCatCache) return _consultaCatCache;
  await _refreshCatCache();
  return _consultaCatCache;
};

const _refreshCatCache = async () => {
  const [agendar, consulta] = await Promise.all([
    TreatmentCategory.find({ botFlow: { $in: ["AGENDAR", "BOTH"] }, isActive: true }).sort({ name: 1 }),
    TreatmentCategory.find({ botFlow: { $in: ["CONSULTA", "BOTH"] }, isActive: true }).sort({ name: 1 }),
  ]);
  _agendarCatCache = agendar.map(_mapCat);
  _consultaCatCache = consulta.map(_mapCat);
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

  // Cargar recepcionistas activas si el cuarto es de recepcionista (para verificar agenda llena)
  const isReceptionistRoom = RECEPTIONIST_ROOMS.includes(roomId);
  const receptionists = isReceptionistRoom ? await getActiveReceptionists() : [];

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

    // Query adicional: todas las citas en cuartos de recepcionista (para contar recepcionistas ocupadas)
    const allReceptionistFilter = isReceptionistRoom
      ? { roomId: { $in: RECEPTIONIST_ROOMS }, appointmentDate: { $gte: dayStart, $lte: dayEnd }, status: { $nin: ["CANCELLED"] } }
      : null;

    const [appointments, blocks, allReceptionistAppts] = await Promise.all([
      Appointment.find(appointmentFilter),
      TimeBlock.find({
        doctorId: perfId,
        startTime: { $lte: dayEnd },
        endTime: { $gte: dayStart },
        isActive: true,
      }),
      allReceptionistFilter ? Appointment.find(allReceptionistFilter) : Promise.resolve([]),
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

        if (conflict) continue;

        // Para cuartos de recepcionista: verificar que haya al menos una recepcionista libre
        if (isReceptionistRoom && receptionists.length > 0) {
          const overlapping = allReceptionistAppts.filter((a) => {
            const aEnd = new Date(a.appointmentDate.getTime() + a.duration * 60000);
            return slotStart < aEnd && slotEnd > a.appointmentDate;
          });
          const busyIds = new Set(
            overlapping.map((a) => String(a.doctorId)).filter((id) => !botIds.includes(id)),
          );
          const freeCount = receptionists.filter((r) => !busyIds.has(String(r._id))).length;
          if (freeCount === 0) continue;
        }

        available.push(slotStart);
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

/**
 * Carga TODOS los treatments activos de categorías con botFlow CONSULTA o BOTH.
 * Limitado a 10 para cumplir el máximo de filas de WhatsApp list.
 */
const getConsultaTreatments = async () => {
  const cats = await getConsultaCategories();
  const slugs = cats.map((c) => c.treatmentCategory);
  return Treatment.find({ category: { $in: slugs }, isActive: true })
    .select("_id name estimatedDuration category")
    .sort({ name: 1 })
    .limit(10);
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
    // No hay slots — ofrecer agregar a lista de espera
    sessions.set(phone, {
      ...session,
      state: "WAITLIST_PIDIENDO_NOMBRE",
      performerId,
      slotDuration,
    });
    await sendWhatsAppMessage(
      phone,
      `Lo sentimos, no hay horarios disponibles esta semana para *${session.categoryLabel}*. 😔\n\nSi nos das tu *nombre completo*, te avisaremos por aquí si se libera un espacio. ¿Te gustaría que te anotemos?`,
    );
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
      { id: "BTN_AGENDAR",  title: "Agendar" },
      { id: "BTN_CONSULTA", title: "Consulta" },
      { id: "BTN_ASESOR",   title: "Asesor" },
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

    case "BTN_CONSULTA": {
      const consultaTreats = await getConsultaTreatments();
      if (consultaTreats.length === 0) {
        await sendWhatsAppMessage(phone, "Lo sentimos, no hay procedimientos disponibles en este momento. Un asesor te contactará pronto. 🙏");
        sessions.delete(phone);
        break;
      }
      sessions.set(phone, { state: "CONSULTANDO_ELIGIENDO_TRATAMIENTO" });
      await sendWhatsAppList(
        phone,
        "¿Qué procedimiento te interesa?",
        "Ver procedimientos",
        [
          {
            title: "Procedimientos médicos",
            rows: consultaTreats.map((t) => ({
              id: `TREAT_${t._id}`,
              title: t.name.length > 24 ? t.name.substring(0, 24) : t.name,
              description: `${t.estimatedDuration} min`,
            })),
          },
        ],
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
    `¡Muchas gracias, *${nombre}*! 🙏 Tu cita para *${session.treatmentName || session.categoryLabel}* el *${formatSlotFull(session.slotDate)}* ha sido registrada con éxito ✅.\n\n ¡Te esperamos en Sbeltic!`,
  );
  return true;
};

// --- RAMA CONSULTA ---

const handleConsultandoTratamiento = async (phone, parsed, session) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("TREAT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un procedimiento del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const treatmentId = parsed.value.replace("TREAT_", "");
  const treatment = await Treatment.findById(treatmentId).select("name estimatedDuration category");

  if (!treatment) {
    await sendWhatsAppMessage(phone, "No encontré ese procedimiento. Por favor intenta de nuevo.");
    return true;
  }

  const performerId = process.env.BOT_DOCTOR_ID;
  const updatedSession = {
    ...session,
    treatmentId: String(treatment._id),
    treatmentName: treatment.name,
    treatmentCategory: treatment.category,
    roomId: "CONSULTORIO",
    categoryLabel: treatment.name,
    slotDuration: treatment.estimatedDuration || 30,
  };

  await showSlots(phone, performerId, updatedSession, "CONSULTANDO_MOSTRANDO_SLOTS", updatedSession.slotDuration);
  return true;
};

const handleConsultandoSlot = async (phone, parsed) => {
  if (parsed.kind !== "list" || !parsed.value.startsWith("SLOT_")) {
    await sendWhatsAppMessage(phone, "Por favor selecciona un horario del menú.\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  const slotDate = new Date(parseInt(parsed.value.replace("SLOT_", ""), 10));
  const session = sessions.get(phone);

  sessions.set(phone, { ...session, state: "CONSULTANDO_PIDIENDO_NOMBRE", slotDate });

  await sendWhatsAppMessage(
    phone,
    `¡Excelente! Tienes seleccionado el *${formatSlotFull(slotDate)}* para *${session.treatmentName || session.categoryLabel}*. 🗓️\n\nPor favor escríbeme tu *nombre completo y edad* separados por una coma.\nEjemplo: _María López, 32_`,
  );
  return true;
};

const handleConsultandoNombre = async (phone, parsed, session) => {
  if (parsed.kind !== "text" || !parsed.value) {
    await sendWhatsAppMessage(phone, "Por favor escríbeme tu nombre y edad separados por coma.\nEjemplo: _María López, 32_\n\nEscribe *menú* para volver al inicio.");
    return true;
  }

  // Parsear "Nombre Apellido, 32"
  const parts = parsed.value.split(",");
  const nombre = parts[0]?.trim();
  const edad = parseInt(parts[1]?.trim(), 10);

  if (!nombre || isNaN(edad) || edad < 1 || edad > 120) {
    await sendWhatsAppMessage(
      phone,
      "No pude leer tu nombre y edad. Por favor escríbelos separados por una coma.\nEjemplo: _María López, 32_",
    );
    return true;
  }

  const { patient } = await findOrCreateLead(nombre, phone);

  // Guardar edad en historial de identificación
  await Patient.findByIdAndUpdate(patient._id, {
    $set: { "medicalHistory.identification.age": edad },
  });

  // Crear cita tentativa
  try {
    await createAppointment(
      patient._id,
      process.env.BOT_DOCTOR_ID,
      "CONSULTORIO",
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

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // Generar link historial médico (1h de expiración)
  console.log("📋 [WA-BOT] Generando token historial para paciente:", patient._id);
  const historialToken = await generateSignatureToken(
    patient._id,
    String(patient._id),
    "MEDICAL_HISTORY_FORM",
    1,
  );
  const historialLink = `${baseUrl}/paciente/historial/${historialToken}`;

  sessions.delete(phone);

  // Mensaje 1: link historial médico (ya incluye firma al final del formulario)
  await sendWhatsAppMessage(
    phone,
    `*${nombre}*, tu cita para *${session.treatmentName || session.categoryLabel}* el *${formatSlotFull(session.slotDate)}* ha sido reservada ✅.\n\nAntes de tu consulta necesitamos tu historial médico y firma. El siguiente enlace es seguro y caduca en 1 hora o al terminar:\n\n${historialLink}`,
  );

  // Mensaje 2: agradecimiento
  await sendWhatsAppMessage(
    phone,
    `¡Gracias por tu confianza, *${nombre}*! 🙏 Un médico revisará tu caso. ¡Te esperamos en Sbeltic! 🌿`,
  );

  return true;
};

// --- WAITLIST (sin slots disponibles) ---

const handleWaitlistNombre = async (phone, parsed, session) => {
  if (parsed.kind !== "text" || !parsed.value) {
    await sendWhatsAppMessage(
      phone,
      "Por favor escríbeme tu nombre completo para anotarte en la lista de espera.\n\nEscribe *menú* para volver al inicio.",
    );
    return true;
  }

  const nombre = parsed.value;
  const { patient } = await findOrCreateLead(nombre, phone);

  // Fecha deseada: hoy (inicio del día) para que coincida con búsquedas por rango
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar que no exista un entry duplicado
  const existing = await Waitlist.findOne({
    patientId: patient._id,
    doctorId: session.performerId,
    desiredDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
    status: "WAITING",
  });

  if (!existing) {
    await Waitlist.create({
      patientId: patient._id,
      doctorId: session.performerId,
      desiredDate: today,
      status: "WAITING",
    });
  }

  sessions.delete(phone);

  await sendWhatsAppMessage(
    phone,
    `¡Listo, *${nombre}*! Te hemos anotado en nuestra lista de espera para *${session.treatmentName || session.categoryLabel}*. 📋\n\nSi se libera un espacio esta semana, te avisaremos por aquí. ¡Gracias por tu paciencia! 🙏`,
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

    case "CONSULTANDO_ELIGIENDO_TRATAMIENTO":
      return handleConsultandoTratamiento(phone, parsed, session);

    case "CONSULTANDO_MOSTRANDO_SLOTS":
      return handleConsultandoSlot(phone, parsed);

    case "CONSULTANDO_PIDIENDO_NOMBRE":
      return handleConsultandoNombre(phone, parsed, session);

    case "WAITLIST_PIDIENDO_NOMBRE":
      return handleWaitlistNombre(phone, parsed, session);

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
