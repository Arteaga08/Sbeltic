import { subDays, addDays, startOfDay, endOfDay, addHours } from "date-fns";
import Appointment from "../models/Appointment.js";

// ==========================================
// 🔍 1. LOS BUSCADORES (Tus consultas)
// ==========================================

/**
 * 📢 Busca pacientes para invitar a referir (14 días después de su 1ra cita)
 */
export const processReferralCampaign = async () => {
  const targetDate = subDays(new Date(), 14);

  const appointments = await Appointment.find({
    status: "COMPLETED",
    appointmentDate: {
      $gte: startOfDay(targetDate),
      $lte: endOfDay(targetDate),
    },
  }).populate("patientId");

  return appointments.filter(
    (appt) => appt.patientId?.allowsWhatsAppNotifications,
  );
};

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
  const targetStart = addHours(now, 1); // 1 hora a partir de ahora
  // Le damos un margen de 15 minutos de búsqueda porque el CRON corre cada 15 min
  const targetEnd = new Date(targetStart.getTime() + 15 * 60000);

  const appointments = await Appointment.find({
    status: { $in: ["PENDING", "CONFIRMED"] },
    isReminderSent: false, // Solo a los que no les hemos avisado
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
// 🚀 2. LOS EJECUTORES (Lo que llama el CRON)
// ==========================================

export const sendReferralInvitations = async () => {
  try {
    const targets = await processReferralCampaign();
    if (targets.length === 0) return;

    for (const appt of targets) {
      const patient = appt.patientId;
      // 📢 Aquí irá la API de Meta (WhatsApp)
      console.log(
        `📲 [MARKETING] Enviando código de referido a ${patient.name} (${patient.phone}): "Hola ${patient.name.split(" ")[0]}, hace 14 días nos visitaste. ¡Comparte tu código ${patient.referralCode} y gana descuentos!"`,
      );
    }
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
        `📲 [CLÍNICO] Recordatorio de retoque a ${patient.name} (${patient.phone}): "Hola, mañana te toca revisión de retoque por tu tratamiento de ${appt.treatmentName}. ¿Agendamos?"`,
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

      // Marcamos la cita para no volver a enviarle mensaje si el cron corre de nuevo
      appt.isReminderSent = true;
      await appt.save();
    }
  } catch (error) {
    console.error("❌ Error en sendHourlyReminders:", error);
  }
};
