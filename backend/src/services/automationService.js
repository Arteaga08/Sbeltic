import { subDays, addDays, addWeeks, addMonths, startOfDay, endOfDay, addHours, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import Appointment from "../models/Appointment.js";
import Patient from "../models/clinical/Patient.js";
import Coupon from "../models/marketing/Coupon.js";
import Waitlist from "../models/clinical/Waitlist.js";
import { sendWhatsAppMessage } from "./whatsappService.js";

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
 * ⏱️ Busca citas agendadas que ocurren exactamente en 1 hora
 * (Ideal para correr cada 15 minutos en el CRON)
 */
export const processHourlyReminders = async () => {
  const now = new Date();
  const targetStart = addHours(now, 1);
  const targetEnd = new Date(targetStart.getTime() + 15 * 60000);

  const appointments = await Appointment.find({
    status: { $in: ["PENDING", "CONFIRMED"] },
    isReminderSent: false,
    appointmentDate: {
      $gte: targetStart,
      $lt: targetEnd,
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
    for (const patient of eligiblePatients) {
      const message = (coupon.whatsappMessageTemplate || "")
        .replace(/{{nombre}}/g, patient.name?.split(" ")[0] || "")
        .replace(/{{codigo}}/g, coupon.code)
        .replace(/{{descuento}}/g, coupon.discountType === "PERCENTAGE"
          ? `${coupon.discountValue}%`
          : `$${coupon.discountValue}`);

      await sendWhatsAppMessage(patient.phone, message);
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

    for (const appt of targets) {
      const patient = appt.patientId;
      const message = coupon.whatsappMessageTemplate
        .replace(/{{nombre}}/g, patient.name?.split(" ")[0] || "")
        .replace(/{{codigo}}/g, coupon.code)
        .replace(/{{descuento}}/g, coupon.discountType === "PERCENTAGE"
          ? `${coupon.discountValue}%`
          : `$${coupon.discountValue}`);

      await sendWhatsAppMessage(patient.phone, message);
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
      const message = (coupon.whatsappMessageTemplate || "")
        .replace(/{{nombre}}/g, patient.name?.split(" ")[0] || "")
        .replace(/{{codigo}}/g, coupon.code)
        .replace(/{{descuento}}/g, coupon.discountType === "PERCENTAGE"
          ? `${coupon.discountValue}%`
          : `$${coupon.discountValue}`);

      coupon.schedule.lastSentAt = new Date();
      await coupon.save();
      await sendWhatsAppMessage(patient.phone, message);
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

export const sendHourlyReminders = async () => {
  try {
    const targets = await processHourlyReminders();
    if (targets.length === 0) return;

    for (const appt of targets) {
      const patient = appt.patientId;
      const firstName = patient.name?.split(" ")[0] || "Paciente";
      await sendWhatsAppMessage(
        patient.phone,
        `Hola ${firstName}, tu cita en Sbeltic es en 1 hora. Responde 1 para confirmar o 2 para cancelar.`,
      );

      appt.isReminderSent = true;
      await appt.save();
    }
  } catch (error) {
    console.error("❌ Error en sendHourlyReminders:", error);
  }
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

      // Buscar siguiente candidato en la cola para el mismo doctor y fecha
      const nextCandidate = await Waitlist.findOne({
        doctorId: entry.doctorId,
        desiredDate: entry.desiredDate,
        status: "WAITING",
      }).populate("patientId", "name phone");

      if (nextCandidate && nextCandidate.patientId) {
        nextCandidate.status = "NOTIFIED";
        nextCandidate.notifiedAt = new Date();
        await nextCandidate.save();

        const patient = nextCandidate.patientId;
        const firstName = patient.name?.split(" ")[0] || "Paciente";
        await sendWhatsAppMessage(
          patient.phone,
          `Hola ${firstName}, se liberó un espacio. ¿Deseas tomarlo? Responde 1 para aceptar.`,
        );
      }
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
