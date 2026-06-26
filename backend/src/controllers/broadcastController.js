import mongoose from "mongoose";
import Broadcast from "../models/marketing/Broadcast.js";
import Patient from "../models/clinical/Patient.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * 1. CREAR CAMPAÑA DE DIFUSIÓN
 * Recibe { message, patientIds } y guarda un snapshot de cada destinatario.
 */
const createBroadcast = asyncHandler(async (req, res, next) => {
  const { message, patientIds } = req.body;

  const patients = await Patient.find({
    _id: { $in: patientIds },
    isActive: true,
  }).select("name phone");

  if (patients.length === 0) {
    return next(new AppError("No se encontraron pacientes válidos", 404));
  }

  const recipients = patients.map((p) => ({
    patientId: p._id,
    name: p.name,
    phone: p.phone,
    sent: false,
  }));

  const broadcast = await Broadcast.create({
    message,
    recipients,
    totalRecipients: recipients.length,
    sentCount: 0,
    createdBy: req.user?._id,
  });

  sendResponse(res, 201, broadcast, "Campaña de difusión creada");
});

/**
 * 2. LISTAR HISTORIAL DE CAMPAÑAS
 */
const getBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
  sendResponse(res, 200, broadcasts, "Historial de campañas");
});

/**
 * 3. OBTENER UNA CAMPAÑA POR ID
 */
const getBroadcastById = asyncHandler(async (req, res, next) => {
  const broadcast = await Broadcast.findById(req.params.id);
  if (!broadcast) return next(new AppError("Campaña no encontrada", 404));
  sendResponse(res, 200, broadcast, "Campaña encontrada");
});

/**
 * 4. MARCAR UN DESTINATARIO COMO ENVIADO (idempotente)
 */
const markRecipientSent = asyncHandler(async (req, res, next) => {
  const { id, patientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return next(new AppError("ID de paciente inválido", 400));
  }

  const broadcast = await Broadcast.findById(id);
  if (!broadcast) return next(new AppError("Campaña no encontrada", 404));

  const recipient = broadcast.recipients.find(
    (r) => r.patientId.toString() === patientId,
  );
  if (!recipient) {
    return next(new AppError("Destinatario no encontrado en la campaña", 404));
  }

  if (!recipient.sent) {
    recipient.sent = true;
    recipient.sentAt = new Date();
    broadcast.sentCount = broadcast.recipients.filter((r) => r.sent).length;
    await broadcast.save();
  }

  sendResponse(res, 200, broadcast, "Destinatario marcado como enviado");
});

/**
 * 5. ELIMINAR CAMPAÑA DEL HISTORIAL
 */
const deleteBroadcast = asyncHandler(async (req, res, next) => {
  const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
  if (!broadcast) return next(new AppError("Campaña no encontrada", 404));
  sendResponse(res, 200, null, "Campaña eliminada");
});

export {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  markRecipientSent,
  deleteBroadcast,
};
