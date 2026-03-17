import mongoose from "mongoose"; // 🌟 Importamos mongoose para validar el ID
import Patient from "../models/clinical/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { sendResponse } from "../utils/responseHandler.js";

// 🔍 Obtener info para el celular del paciente (Nombre y Tipo)
const getSignInfo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 🛡️ BLINDAJE: Validar si el ID es un ObjectId válido de MongoDB
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("El formato del enlace es inválido", 400));
  }

  // Buscar si es ID de Paciente
  let patient = await Patient.findById(id);
  if (patient) {
    return sendResponse(res, 200, { name: patient.name, type: "HISTORY" });
  }

  // Buscar si es ID de una Evolución dentro de un Paciente
  patient = await Patient.findOne({ "evolutions._id": id });
  if (patient) {
    const evo = patient.evolutions.id(id);
    return sendResponse(res, 200, { name: patient.name, type: "EVOLUTION" });
  }

  return next(new AppError("El enlace ha expirado o es inválido", 404));
});

// 🖋️ Guardar la firma que viene del celular
const saveSignature = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { signature } = req.body;

  // 🛡️ BLINDAJE: Validar ID aquí también por seguridad
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("El formato del enlace es inválido", 400));
  }

  // 1. ¿Es firma de Historia Clínica?
  let patient = await Patient.findById(id);
  if (patient) {
    patient.historySignature = signature;
    await patient.save();
    return sendResponse(res, 200, null, "Firma de historia clínica guardada");
  }

  // 2. ¿Es firma de Evolución?
  patient = await Patient.findOne({ "evolutions._id": id });
  if (patient) {
    const evo = patient.evolutions.id(id);
    evo.patientSignature = signature;
    await patient.save();
    return sendResponse(res, 200, null, "Firma de evolución guardada");
  }

  return next(new AppError("No se pudo procesar la firma", 404));
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { getSignInfo, saveSignature };
