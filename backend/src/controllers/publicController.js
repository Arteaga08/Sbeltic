import crypto from "crypto";
import Patient from "../models/clinical/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { sendResponse } from "../utils/responseHandler.js";

// 🔑 Generar token temporal para link de firma (llamado desde patientController)
const generateSignatureToken = async (patientId, targetId, type, expiresInHours = 72) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");

  patient.signatureTokens.push({ token, targetId, type, expiresAt });
  await patient.save();

  return token;
};

// 🔍 Obtener info para el celular del paciente (validando token)
const getSignInfo = asyncHandler(async (req, res, next) => {
  const { id: token } = req.params;

  const patient = await Patient.findOne({
    "signatureTokens.token": token,
    "signatureTokens.expiresAt": { $gt: new Date() },
    "signatureTokens.used": false,
  });

  if (!patient) {
    return next(new AppError("El enlace ha expirado o es inválido", 404));
  }

  const tokenData = patient.signatureTokens.find(
    (t) => t.token === token && t.expiresAt > new Date() && !t.used,
  );

  sendResponse(res, 200, { name: patient.name, type: tokenData.type });
});

// 🖋️ Guardar la firma que viene del celular (validando token)
const saveSignature = asyncHandler(async (req, res, next) => {
  const { id: token } = req.params;
  const { signature } = req.body;

  const patient = await Patient.findOne({
    "signatureTokens.token": token,
    "signatureTokens.expiresAt": { $gt: new Date() },
    "signatureTokens.used": false,
  });

  if (!patient) {
    return next(new AppError("El enlace ha expirado o es inválido", 404));
  }

  const tokenData = patient.signatureTokens.find(
    (t) => t.token === token && t.expiresAt > new Date() && !t.used,
  );

  if (tokenData.type === "HISTORY") {
    patient.historySignature = signature;
  } else if (tokenData.type === "EVOLUTION") {
    const evo = patient.evolutions.id(tokenData.targetId);
    if (!evo) return next(new AppError("Evolución no encontrada", 404));
    evo.patientSignature = signature;
  }

  // Marcar token como usado
  tokenData.used = true;
  await patient.save();

  const msg =
    tokenData.type === "HISTORY"
      ? "Firma de historia clínica guardada"
      : "Firma de evolución guardada";

  sendResponse(res, 200, null, msg);
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { getSignInfo, saveSignature, generateSignatureToken };
