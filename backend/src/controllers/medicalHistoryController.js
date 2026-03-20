import Patient from "../models/clinical/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { sendResponse } from "../utils/responseHandler.js";

// 🔍 Validar token antes de mostrar el formulario al paciente
const validateMedicalHistoryToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  const patient = await Patient.findOne({
    "signatureTokens.token": token,
    "signatureTokens.type": "MEDICAL_HISTORY_FORM",
  });

  if (!patient) {
    return next(new AppError("Enlace inválido", 404));
  }

  const tokenData = patient.signatureTokens.find(
    (t) => t.token === token && t.type === "MEDICAL_HISTORY_FORM",
  );

  if (tokenData.used) {
    return res.status(410).json({
      success: false,
      reason: "used",
      message: "Este formulario ya fue completado.",
    });
  }

  if (tokenData.expiresAt < new Date()) {
    return res.status(410).json({
      success: false,
      reason: "expired",
      message: "Este enlace ha expirado.",
    });
  }

  sendResponse(res, 200, { patientName: patient.name });
});

// 📋 Guardar el historial médico completo + firma enviados por el paciente
const submitMedicalHistory = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { medicalHistory, historySignature } = req.body;

  // Re-validar token para prevenir race conditions
  const patient = await Patient.findOne({
    "signatureTokens.token": token,
    "signatureTokens.type": "MEDICAL_HISTORY_FORM",
    "signatureTokens.expiresAt": { $gt: new Date() },
    "signatureTokens.used": false,
  });

  if (!patient) {
    return next(new AppError("El enlace ha expirado o ya fue utilizado", 410));
  }

  const tokenData = patient.signatureTokens.find(
    (t) =>
      t.token === token &&
      t.type === "MEDICAL_HISTORY_FORM" &&
      t.expiresAt > new Date() &&
      !t.used,
  );

  // Guardar historial médico por secciones
  if (medicalHistory) {
    const sections = [
      "identification",
      "allergies",
      "vital",
      "comorbidities",
      "family",
      "gyneco",
      "systems",
      "pathological",
      "habits",
      "currentCondition",
    ];
    sections.forEach((section) => {
      if (medicalHistory[section] !== undefined) {
        patient.medicalHistory[section] = medicalHistory[section];
      }
    });
  }

  // Guardar firma digital
  if (historySignature) {
    patient.historySignature = historySignature;
  }

  // Marcar perfil como completo y token como usado
  patient.isProfileComplete = true;
  tokenData.used = true;

  await patient.save();

  sendResponse(res, 200, null, "Historial médico guardado correctamente");
});

export { validateMedicalHistoryToken, submitMedicalHistory };
