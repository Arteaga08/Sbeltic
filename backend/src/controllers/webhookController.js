import Appointment from "../models/Appointment.js";
import Patient from "../models/clinical/Patient.js";
import Waitlist from "../models/clinical/Waitlist.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";
import { notifyNextWaitlistCandidate } from "../services/automationService.js";
import { handleStateMachine, hasActiveSession } from "./whatsappController.js";

/**
 * GET /api/webhooks/whatsapp — Verificación del webhook de Meta
 * Meta envía un GET con hub.verify_token para validar el endpoint.
 */
export const verifyWhatsAppWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // DEBUG: Vamos a ver qué está recibiendo Node y qué tiene en memoria

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Error de token");
};

/**
 * POST /api/webhooks/whatsapp — Recibir mensajes entrantes de WhatsApp
 * Procesa respuestas de pacientes (ej. "1" para confirmar, "2" para cancelar).
 */
export const handleWhatsAppWebhook = async (req, res) => {
  // Meta espera un 200 inmediato para no reintentar
  res.sendStatus(200);

  try {
    const body = req.body;

    // Extraer el mensaje del payload de Meta
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return;

    let msg = messages[0];
    let from = msg.from; // Número del remitente (sin +)

    if (from.startsWith("521") && from.length === 13) {
      from = "52" + from.substring(3);
    }

    console.log(`📩 [WEBHOOK] Mensaje de ${from} | tipo: ${msg.type}`);

    // --- ROUTING ---
    // Mensajes interactivos (botones/listas) y sesiones activas → state machine
    // "1" o "2" sin sesión activa → flujo legacy de citas
    const rawText = msg.text?.body?.trim();
    const isLegacyReply =
      msg.type === "text" && (rawText === "1" || rawText === "2");

    if (hasActiveSession(from) || !isLegacyReply) {
      const handled = await handleStateMachine(msg, from);
      if (handled) return;
      // Si retorna false (HUMAN_TAKEOVER), caer al flujo legacy
    }

    // --- FLUJO LEGACY: confirmación/cancelación de citas ("1" / "2") ---
    if (!rawText) return;

    const patient = await Patient.findOne({
      phone: { $regex: from.slice(-10) },
    });

    if (!patient) {
      // Número desconocido intentando "1"/"2" → iniciar bot
      await handleStateMachine(msg, from);
      return;
    }

    if (rawText === "1") {
      await handleConfirmation(patient, from);
    } else if (rawText === "2") {
      await handleCancellation(patient, from);
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error procesando mensaje:", error);
  }
};

/**
 * El paciente respondió "1" — confirmar cita o aceptar waitlist
 */
const handleConfirmation = async (patient, phone) => {
  const firstName = patient.name?.split(" ")[0] || "Paciente";

  // 1. Verificar si tiene un entry de Waitlist NOTIFIED
  const waitlistEntry = await Waitlist.findOne({
    patientId: patient._id,
    status: "NOTIFIED",
  });

  if (waitlistEntry) {
    // Auto-conversión Waitlist → Appointment
    const created = await autoConvertWaitlistToAppointment(
      waitlistEntry,
      patient,
    );
    if (created) {
      await sendWhatsAppMessage(
        phone,
        `${firstName}, tu cita ha sido confirmada exitosamente. Te esperamos.`,
      );
    } else {
      await sendWhatsAppMessage(
        phone,
        `${firstName}, lamentablemente el espacio ya no está disponible. Te mantendremos en la lista.`,
      );
    }
    return;
  }

  // 2. Verificar si tiene cita PENDING próxima
  const pendingAppt = await Appointment.findOne({
    patientId: patient._id,
    status: "PENDING",
    appointmentDate: { $gte: new Date() },
  }).sort({ appointmentDate: 1 });

  if (pendingAppt) {
    pendingAppt.status = "CONFIRMED";
    await pendingAppt.save();

    await sendWhatsAppMessage(
      phone,
      `${firstName}, tu cita ha sido confirmada. Te esperamos.`,
    );
    return;
  }

  await sendWhatsAppMessage(
    phone,
    `${firstName}, no encontramos una cita pendiente asociada. Contacta a recepción para más información.`,
  );
};

/**
 * El paciente respondió "2" — cancelar cita
 */
const handleCancellation = async (patient, phone) => {
  const firstName = patient.name?.split(" ")[0] || "Paciente";

  const upcomingAppt = await Appointment.findOne({
    patientId: patient._id,
    status: { $in: ["PENDING", "CONFIRMED"] },
    appointmentDate: { $gte: new Date() },
  }).sort({ appointmentDate: 1 });

  if (upcomingAppt) {
    upcomingAppt.status = "CANCELLED";
    await upcomingAppt.save();

    await sendWhatsAppMessage(
      phone,
      `${firstName}, tu cita ha sido cancelada. Si deseas reagendar, contacta a recepción.`,
    );

    // Notificar al siguiente candidato en waitlist (con criterio semanal)
    await notifyNextWaitlistCandidate(upcomingAppt.doctorId, upcomingAppt.appointmentDate);
    return;
  }

  await sendWhatsAppMessage(
    phone,
    `${firstName}, no encontramos una cita próxima para cancelar.`,
  );
};

/**
 * Convierte una entrada de Waitlist en una Appointment real.
 * Usa la misma lógica de colisión antes de crear.
 */
const autoConvertWaitlistToAppointment = async (waitlistEntry, patient) => {
  try {
    // Buscar el slot cancelado del mismo doctor y fecha
    const cancelledAppt = await Appointment.findOne({
      doctorId: waitlistEntry.doctorId,
      status: "CANCELLED",
      appointmentDate: {
        $gte: new Date(waitlistEntry.desiredDate).setHours(0, 0, 0, 0),
        $lte: new Date(waitlistEntry.desiredDate).setHours(23, 59, 59, 999),
      },
    }).sort({ updatedAt: -1 }); // El más recientemente cancelado

    if (!cancelledAppt) {
      waitlistEntry.status = "EXPIRED";
      await waitlistEntry.save();
      return false;
    }

    // Crear nueva cita en el mismo slot
    const newAppointment = new Appointment({
      patientId: patient._id,
      doctorId: cancelledAppt.doctorId,
      roomId: cancelledAppt.roomId,
      appointmentDate: cancelledAppt.appointmentDate,
      duration: cancelledAppt.duration,
      treatmentName: cancelledAppt.treatmentName || "Por definir",
      treatmentCategory: cancelledAppt.treatmentCategory,
      status: "CONFIRMED",
      createdBy: cancelledAppt.createdBy,
    });

    await newAppointment.save(); // El pre-save hook verificará colisiones

    waitlistEntry.status = "RESOLVED";
    await waitlistEntry.save();

    return true;
  } catch (error) {
    console.error("❌ [WAITLIST-AUTO] Error al crear cita:", error.message);
    // Si hay colisión (409), el slot ya no está disponible
    waitlistEntry.status = "EXPIRED";
    await waitlistEntry.save();
    return false;
  }
};
