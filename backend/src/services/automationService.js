import { subDays, addDays, addWeeks, addMonths, startOfDay, endOfDay, addHours, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import Appointment from "../models/Appointment.js";
import Coupon from "../models/marketing/Coupon.js";

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

  for (const coupon of dueCoupons) {
    console.log(
      `📅 [SCHEDULE] Cupón "${coupon.code}" (${coupon.type}) — envío programado. Template: "${coupon.whatsappMessageTemplate}"`,
    );

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

      // 📲 Aquí irá la API de Meta cuando esté lista
      console.log(
        `📲 [REFERRAL] Para ${patient.name} (${patient.phone}) — Cupón: ${coupon.code}: "${message}"`,
      );
    }
  }
};

/**
 * 🎯 Dispara un cupón por evento para un paciente específico.
 * Llamado desde patientController (ON_NEW_PATIENT) o appointmentController (ON_APPOINTMENT_COMPLETE).
 */
export const processTriggerCoupons = async (event, patient, context = {}) => {
  try {
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
      // 📲 Aquí irá la API de Meta cuando esté lista
      console.log(
        `📲 [TRIGGER:${event}] Para ${patient.name} (${patient.phone}) — Cupón: ${coupon.code}: "${message}"`,
      );
    }
  } catch (error) {
    console.error(`❌ Error en processTriggerCoupons [${event}]:`, error);
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
      console.log(
        `📲 [CLÍNICO] Recordatorio de retoque a ${patient.name} (${patient.phone}): "Hola, mañana te toca revisión de retoque por tu tratamiento. ¿Agendamos?"`,
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
      console.log(
        `📲 [OPERATIVO] Recordatorio urgente a ${patient.name} (${patient.phone}): "Hola, tu cita en Cabina es en 1 hora. Responde 1 para confirmar o 2 para cancelar."`,
      );

      appt.isReminderSent = true;
      await appt.save();
    }
  } catch (error) {
    console.error("❌ Error en sendHourlyReminders:", error);
  }
};
