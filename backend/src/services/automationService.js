import { subDays, addDays, addWeeks, addMonths, startOfDay, endOfDay, addHours, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import Appointment from "../models/Appointment.js";
import Patient from "../models/clinical/Patient.js";
import Coupon from "../models/marketing/Coupon.js";
import Waitlist from "../models/clinical/Waitlist.js";
import { sendWhatsAppMessage, sendWhatsAppTemplate } from "./whatsappService.js";
import Treatment from "../models/clinical/Treatment.js";

// ==========================================
// 🗺️ MAPEO DE PLANTILLAS META POR TIPO
// ==========================================

export const TEMPLATE_MAP = {
  WELCOME: "sbeltic_bienvenida",
  REFERRAL: "sbeltic_referidos",
  MAINTENANCE: "sbeltic_mantenimiento",
  BIRTHDAY: "sbeltic_cumple",
  SEASONAL: "sbeltic_promo_mensual",
  CLEARANCE: "sbeltic_liquidacion",
};

/**
 * Construye el array de components para la API de Meta WhatsApp Templates.
 * El orden de parámetros sigue el orden del texto de cada plantilla.
 */
export const buildTemplateComponents = (coupon, patient, context = {}) => {
  const firstName = patient.name?.split(" ")[0] || "Paciente";
  const discountStr = coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}%`
    : `$${coupon.discountValue}`;
  const vars = coupon.templateVariables || {};

  // Cada entrada puede ser string (variable numerada {{1}}) u objeto {text, name} (variable nombrada {{nombre}})
  const paramMap = {
    WELCOME: [firstName, discountStr, coupon.code],
    REFERRAL: [firstName, discountStr, coupon.code, vars.recompensa || ""],
    MAINTENANCE: [firstName, context.tiempoTranscurrido || "", context.tratamiento || "", discountStr],
    BIRTHDAY: [firstName, vars.mensajePersonalizado || "", vars.regalo || "", coupon.code],
    SEASONAL: [
      { text: firstName, name: "nombre" },
      { text: vars.promocion || discountStr, name: "promocion" },
      { text: coupon.code, name: "codigo" },
    ],
    CLEARANCE: [firstName, vars.producto || "", discountStr, coupon.code],
  };

  const params = paramMap[coupon.type] || [firstName, discountStr, coupon.code];

  return [{
    type: "body",
    parameters: params.map((p) =>
      typeof p === "object" && p.name
        ? { type: "text", text: String(p.text), parameter_name: p.name }
        : { type: "text", text: String(p) }
    ),
  }];
};

// ==========================================
// 🔍 1. LOS BUSCADORES (Consultas de citas)
// ==========================================

/**
 * 🩺 Busca pacientes que tienen retoque mañana
 */
export const processTouchUpReminders = async () => {
  const tomorrow = addDays(new Date(), 1);

  const appointments = await Appointment.find({
    touchUpDate: {
      $gte: startOfDay(tomorrow),
      $lte: endOfDay(tomorrow),
    },
  }).populate("patientId");

  return appointments.filter(
    (appt) => appt.patientId?.allowsWhatsAppNotifications,
  );
};

/**
 * 📅 Busca citas agendadas para mañana (todo el día)
 * (Se ejecuta una vez al día en el CRON de las 8:00 AM)
 */
export const processDailyReminders = async () => {
  const tomorrow = addDays(new Date(), 1);
  const targetStart = startOfDay(tomorrow);
  const targetEnd = endOfDay(tomorrow);

  const appointments = await Appointment.find({
    status: { $in: ["PENDING", "CONFIRMED"] },
    isReminderSent: false,
    appointmentDate: {
      $gte: targetStart,
      $lte: targetEnd,
    },
  }).populate("patientId");

  return appointments.filter(
    (appt) => appt.patientId?.allowsWhatsAppNotifications,
  );
};

// ==========================================
// 📅 2. MOTOR DE SCHEDULE (Lee DB, no hardcode)
// ==========================================

/**
 * Calcula la próxima fecha de envío según la frecuencia del cupón
 */
const calcNextSendAt = (coupon) => {
  const { frequency, sendHour = 8, dayOfWeek, dayOfMonth } = coupon.schedule;
  const now = new Date();

  const atHour = (date) =>
    setMilliseconds(setSeconds(setMinutes(setHours(date, sendHour), 0), 0), 0);

  if (frequency === "WEEKLY") {
    const next = addWeeks(now, 1);
    if (dayOfWeek !== undefined) next.setDay?.(dayOfWeek);
    return atHour(next);
  }

  if (frequency === "MONTHLY") {
    const next = addMonths(now, 1);
    if (dayOfMonth !== undefined) next.setDate(Math.min(dayOfMonth, 28));
    return atHour(next);
  }

  return null; // ONCE y AUTO no tienen nextSendAt recurrente
};

/**
 * 📢 Ejecuta cupones con schedule WEEKLY/MONTHLY cuyo nextSendAt ya venció.
 * (WA API se conecta aquí cuando esté lista — por ahora console.log)
 */
export const processScheduledCoupons = async () => {
  const now = new Date();

  const dueCoupons = await Coupon.find({
    isActive: true,
    "schedule.frequency": { $in: ["WEEKLY", "MONTHLY"] },
    "schedule.nextSendAt": { $lte: now },
  });

  // Filtrar pacientes con opt-in para evitar bloqueos de API de WhatsApp
  const eligiblePatients = await Patient.find({
    isActive: true,
    allowsWhatsAppNotifications: true,
  }).select("name phone");

  for (const coupon of dueCoupons) {
    const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP[coupon.type];

    for (const patient of eligiblePatients) {
      const components = buildTemplateComponents(coupon, patient);
      const result = await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);
      if (result.success) {
        await Patient.updateOne({ _id: patient._id }, { $addToSet: { walletCoupons: coupon._id } });
        coupon.sentTo.push({ patientId: patient._id, sentAt: new Date() });
      }
    }

    // Actualizar lastSentAt y calcular nuevo nextSendAt
    coupon.schedule.lastSentAt = now;
    coupon.schedule.nextSendAt = calcNextSendAt(coupon);
    await coupon.save();
  }
};

/**
 * 📢 Busca cupones REFERRAL y los dispara para pacientes que cumplieron
 * la cantidad de días configurada (delayDays) desde su última cita completada.
 */
export const processReferralCampaign = async () => {
  const referralCoupons = await Coupon.find({
    isActive: true,
    type: "REFERRAL",
    "schedule.triggerEvent": "ON_APPOINTMENT_COMPLETE",
  });

  for (const coupon of referralCoupons) {
    const delayDays = coupon.schedule?.delayDays ?? 14;
    const targetDate = subDays(new Date(), delayDays);

    const appointments = await Appointment.find({
      status: "COMPLETED",
      appointmentDate: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate),
      },
    }).populate("patientId");

    const targets = appointments.filter(
      (appt) => appt.patientId?.allowsWhatsAppNotifications,
    );

    const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP[coupon.type];

    for (const appt of targets) {
      const patient = appt.patientId;
      const components = buildTemplateComponents(coupon, patient);
      await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);
    }
  }
};

/**
 * 🎯 Dispara un cupón por evento para un paciente específico.
 * Llamado desde patientController (ON_NEW_PATIENT) o appointmentController (ON_APPOINTMENT_COMPLETE).
 */
export const processTriggerCoupons = async (event, patient, context = {}) => {
  try {
    // Respetar opt-in de WhatsApp del paciente
    if (!patient?.allowsWhatsAppNotifications) return;

    const coupons = await Coupon.find({
      isActive: true,
      "schedule.triggerEvent": event,
    });

    for (const coupon of coupons) {
      // WELCOME: solo se envía en la primera visita
      if (coupon.type === "WELCOME" && !context.isFirstVisit) continue;

      // REFERRAL: programar envío diferido según delayDays del cupón
      if (coupon.type === "REFERRAL") {
        const sendAt = new Date();
        sendAt.setDate(sendAt.getDate() + (coupon.schedule?.delayDays || 14));
        coupon.schedule.nextSendAt = sendAt;
        await coupon.save();
        console.log(
          `📲 [TRIGGER:${event}] REFERRAL "${coupon.code}" → programado para ${sendAt.toLocaleDateString()} (paciente: ${patient.name})`,
        );
        continue;
      }

      // Envío inmediato (WELCOME u otros AUTO)
      const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP[coupon.type];
      const components = buildTemplateComponents(coupon, patient, context);

      coupon.schedule.lastSentAt = new Date();
      await coupon.save();
      await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);
    }
  } catch (error) {
    console.error(`❌ Error en processTriggerCoupons [${event}]:`, error);
  }
};

/**
 * 🏥 Busca citas completadas hace 24h y 48h para enviar cuidados post-operatorios
 */
export const processPostOperativeCare = async () => {
  const now = new Date();

  for (const hoursAgo of [24, 48]) {
    const targetStart = startOfDay(subDays(now, hoursAgo / 24));
    const targetEnd = endOfDay(subDays(now, hoursAgo / 24));

    // Buscar citas completadas en la ventana de tiempo correspondiente
    const appointments = await Appointment.find({
      status: "COMPLETED",
      updatedAt: { $gte: targetStart, $lte: targetEnd },
    }).populate("patientId");

    const targets = appointments.filter(
      (appt) => appt.patientId?.allowsWhatsAppNotifications,
    );

    for (const appt of targets) {
      const patient = appt.patientId;
      const firstName = patient.name?.split(" ")[0] || "Paciente";

      const message = hoursAgo === 24
        ? `Hola ${firstName}, han pasado 24 horas desde tu procedimiento en Sbeltic. Recuerda seguir las indicaciones de cuidado. Si tienes alguna molestia, no dudes en contactarnos.`
        : `Hola ${firstName}, a 48 horas de tu tratamiento, esperamos que tu recuperación vaya bien. Recuerda mantener los cuidados indicados. Estamos para ti.`;

      await sendWhatsAppMessage(patient.phone, message);
    }
  }
};

/**
 * 📋 Busca citas con nextFollowUpDate para mañana y envía recordatorio
 */
export const processFollowUpReminders = async () => {
  const tomorrow = addDays(new Date(), 1);

  const appointments = await Appointment.find({
    nextFollowUpDate: {
      $gte: startOfDay(tomorrow),
      $lte: endOfDay(tomorrow),
    },
    status: "COMPLETED",
  }).populate("patientId");

  const targets = appointments.filter(
    (appt) => appt.patientId?.allowsWhatsAppNotifications,
  );

  for (const appt of targets) {
    const patient = appt.patientId;
    const firstName = patient.name?.split(" ")[0] || "Paciente";

    const message = `Hola ${firstName}, mañana tienes una cita de seguimiento programada en Sbeltic. ¿Te gustaría confirmar tu horario?`;

    await sendWhatsAppMessage(patient.phone, message);
  }
};

// ==========================================
// 🎂 CUPONES DE CUMPLEAÑOS
// ==========================================

const processBirthdayCoupons = async () => {
  const birthdayCoupons = await Coupon.find({
    isActive: true,
    type: "BIRTHDAY",
    expiresAt: { $gte: new Date() },
  });

  if (birthdayCoupons.length === 0) return;

  const currentYear = new Date().getFullYear();

  for (const coupon of birthdayCoupons) {
    const daysBeforeBirthday = coupon.templateVariables?.daysBeforeBirthday || 0;
    const targetDate = addDays(new Date(), daysBeforeBirthday);
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    // Buscar pacientes cuyo cumpleaños coincide con la fecha objetivo
    const patients = await Patient.find({
      dateOfBirth: { $exists: true, $ne: null },
      allowsWhatsAppNotifications: true,
      $expr: {
        $and: [
          { $eq: [{ $month: "$dateOfBirth" }, targetMonth] },
          { $eq: [{ $dayOfMonth: "$dateOfBirth" }, targetDay] },
        ],
      },
    }).select("name phone dateOfBirth");

    const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP.BIRTHDAY;

    for (const patient of patients) {
      // Verificar que no se haya enviado este año
      const alreadySent = coupon.sentTo?.some(
        (s) => s.patientId?.toString() === patient._id.toString() && s.year === currentYear,
      );
      if (alreadySent) continue;

      const components = buildTemplateComponents(coupon, patient);
      await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);

      // Registrar envío
      coupon.sentTo.push({ patientId: patient._id, sentAt: new Date(), year: currentYear });
    }

    if (coupon.isModified()) await coupon.save();
  }
};

// ==========================================
// 🔧 CUPONES DE MANTENIMIENTO
// ==========================================

const processMaintenanceCoupons = async () => {
  const maintenanceCoupons = await Coupon.find({
    isActive: true,
    type: "MAINTENANCE",
    expiresAt: { $gte: new Date() },
    "maintenanceConfig.treatmentId": { $exists: true },
  });

  if (maintenanceCoupons.length === 0) return;

  for (const coupon of maintenanceCoupons) {
    // Obtener el tratamiento para saber los días de retoque
    const treatment = await Treatment.findById(coupon.maintenanceConfig.treatmentId);
    if (!treatment) continue;

    const touchUpDays = coupon.maintenanceConfig.touchUpDays || treatment.suggestedTouchUpDays;
    if (!touchUpDays) continue;

    // Buscar citas completadas hace exactamente touchUpDays días (ventana de 1 día)
    const targetDate = subDays(new Date(), touchUpDays);
    const appointments = await Appointment.find({
      status: "COMPLETED",
      treatmentId: treatment._id,
      appointmentDate: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate),
      },
    }).populate("patientId");

    const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP.MAINTENANCE;

    for (const appt of appointments) {
      const patient = appt.patientId;
      if (!patient?.allowsWhatsAppNotifications) continue;

      // Verificar que no se haya enviado ya para esta cita
      const alreadySent = coupon.sentTo?.some(
        (s) => s.patientId?.toString() === patient._id.toString(),
      );
      if (alreadySent) continue;

      const components = buildTemplateComponents(coupon, patient, {
        tiempoTranscurrido: `${touchUpDays} días`,
        tratamiento: treatment.name,
      });
      await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);

      coupon.sentTo.push({ patientId: patient._id, sentAt: new Date() });
    }

    if (coupon.isModified()) await coupon.save();
  }
};

// ==========================================
// 🚀 3. LOS EJECUTORES (Lo que llama el CRON)
// ==========================================

export const sendReferralInvitations = async () => {
  try {
    await processReferralCampaign();
  } catch (error) {
    console.error("❌ Error en sendReferralInvitations:", error);
  }
};

export const sendTouchUpReminders = async () => {
  try {
    const targets = await processTouchUpReminders();
    if (targets.length === 0) return;

    for (const appt of targets) {
      const patient = appt.patientId;
      const firstName = patient.name?.split(" ")[0] || "Paciente";
      await sendWhatsAppMessage(
        patient.phone,
        `Hola ${firstName}, mañana te toca revisión de retoque por tu tratamiento. ¿Agendamos?`,
      );
    }
  } catch (error) {
    console.error("❌ Error en sendTouchUpReminders:", error);
  }
};

export const sendDailyReminders = async () => {
  try {
    const targets = await processDailyReminders();
    if (targets.length === 0) return;

    for (const appt of targets) {
      const patient = appt.patientId;
      const firstName = patient.name?.split(" ")[0] || "Paciente";
      await sendWhatsAppMessage(
        patient.phone,
        `Hola ${firstName}, tu cita en Sbeltic es mañana. Responde 1 para confirmar o 2 para cancelar.`,
      );

      appt.isReminderSent = true;
      await appt.save();
    }
  } catch (error) {
    console.error("❌ Error en sendDailyReminders:", error);
  }
};

/**
 * Helper compartido: notifica al siguiente candidato en waitlist.
 * Salta pacientes que ya tienen cita esa misma semana.
 * @param {ObjectId} doctorId - Doctor de la cita cancelada
 * @param {Date} cancelledDate - Fecha de la cita cancelada
 * @returns {boolean} true si se notificó a alguien
 */
export const notifyNextWaitlistCandidate = async (doctorId, cancelledDate) => {
  const date = new Date(cancelledDate);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Calcular lunes y domingo de la semana
  const dayOfWeek = date.getDay(); // 0=dom, 1=lun...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = startOfDay(addDays(date, mondayOffset));
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const candidates = await Waitlist.find({
    doctorId,
    desiredDate: { $gte: dayStart, $lte: dayEnd },
    status: "WAITING",
  }).populate("patientId", "name phone");

  for (const candidate of candidates) {
    if (!candidate.patientId) continue;

    // Verificar si ya tiene cita esa semana
    const existingThisWeek = await Appointment.findOne({
      patientId: candidate.patientId._id,
      status: { $in: ["PENDING", "CONFIRMED"] },
      appointmentDate: { $gte: weekStart, $lte: weekEnd },
    });

    if (existingThisWeek) continue; // Skip — ya tiene cita esta semana

    candidate.status = "NOTIFIED";
    candidate.notifiedAt = new Date();
    await candidate.save();

    const firstName = candidate.patientId.name?.split(" ")[0] || "Paciente";
    await sendWhatsAppMessage(
      candidate.patientId.phone,
      `Hola ${firstName}, ¡buenas noticias! Se liberó un espacio que querías. ¿Deseas tomarlo? Responde 1 para aceptar.`,
    );

    return true;
  }

  return false;
};

/**
 * Expira notificaciones de waitlist sin respuesta después de 30 minutos.
 * Escala al siguiente candidato en la cola.
 */
export const expireWaitlistNotifications = async () => {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const expired = await Waitlist.find({
      status: "NOTIFIED",
      notifiedAt: { $lte: thirtyMinAgo },
    });

    for (const entry of expired) {
      entry.status = "EXPIRED";
      await entry.save();

      // Escalar al siguiente candidato usando el helper compartido
      await notifyNextWaitlistCandidate(entry.doctorId, entry.desiredDate);
    }
  } catch (error) {
    console.error("❌ Error en expireWaitlistNotifications:", error);
  }
};

export const sendPostOperativeCare = async () => {
  try {
    await processPostOperativeCare();
  } catch (error) {
    console.error("❌ Error en sendPostOperativeCare:", error);
  }
};

export const sendFollowUpReminders = async () => {
  try {
    await processFollowUpReminders();
  } catch (error) {
    console.error("❌ Error en sendFollowUpReminders:", error);
  }
};

export const sendBirthdayCoupons = async () => {
  try {
    await processBirthdayCoupons();
  } catch (error) {
    console.error("❌ Error en sendBirthdayCoupons:", error);
  }
};

export const sendMaintenanceCoupons = async () => {
  try {
    await processMaintenanceCoupons();
  } catch (error) {
    console.error("❌ Error en sendMaintenanceCoupons:", error);
  }
};
