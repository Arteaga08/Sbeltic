import Patient from "../models/clinical/Patient.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { generateSignatureToken } from "./publicController.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";

// Alias para mantener compatibilidad con las llamadas existentes
const sendWA = sendWhatsAppMessage;

const sanitizePatientList = (p) => ({
  _id: p._id,
  name: p.name,
  phone: p.phone,
  email: p.email,
  patientType: p.patientType,
  allowsWhatsAppNotifications: p.allowsWhatsAppNotifications,
  isActive: p.isActive,
  referralCode: p.referralCode,
});

const createPatient = asyncHandler(async (req, res, next) => {
  const { phone, name, patientType, medicalHistory } = req.body;

  const safePhone =
    typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";
  if (!safePhone)
    return next(new AppError("El formato del teléfono es inválido", 400));

  const patientExists = await Patient.findOne({ phone: safePhone });
  if (patientExists)
    return next(new AppError("El teléfono ya está registrado", 400));

  const safeName = typeof name === "string" ? name.trim() : "PACIENTE";
  const firstName = safeName.split(" ")[0].toUpperCase();
  const referralCode = `${firstName}-${Math.floor(1000 + Math.random() * 9000)}`;

  let isProfileComplete = ["SPA", "OTHER"].includes(patientType)
    ? true
    : !!(medicalHistory && Object.keys(medicalHistory).length > 0);

  const patient = new Patient({
    ...req.body,
    phone: safePhone,
    referralCode,
    isProfileComplete,
    createdBy: req.user._id,
  });

  await patient.save();

  // 🤖 AUTOMATIZACIÓN WHATSAPP
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (["SURGERY", "LEAD"].includes(patientType)) {
    // Pacientes SURGERY y LEAD: formulario completo de historial (1 hora)
    const formToken = await generateSignatureToken(
      patient._id,
      String(patient._id),
      "MEDICAL_HISTORY_FORM",
      1,
    );
    const formLink = `${baseUrl}/paciente/historial/${formToken}`;
    await sendWA(
      patient.phone,
      `¡Bienvenido a Sbeltic, ${firstName}! 🏥\n\nPor favor, completa tu historial médico en el siguiente enlace seguro (expira en 1 hora):\n${formLink}`,
    );
  } else {
    // Otros tipos: solo firma de historia clínica
    const signToken = await generateSignatureToken(
      patient._id,
      String(patient._id),
      "HISTORY",
    );
    const signLink = `${baseUrl}/public/${signToken}`;
    await sendWA(
      patient.phone,
      `¡Bienvenido a Sbeltic, ${firstName}! 🏥\n\nPara completar tu registro, por favor firma tu historia clínica digital en el siguiente enlace seguro:\n${signLink}`,
    );
  }

  sendResponse(res, 201, patient, "Paciente registrado exitosamente");
});

const getPatients = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    Patient.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments({ isActive: true }),
  ]);

  sendResponse(res, 200, {
    pagination: { page, pages: Math.ceil(total / limit), total },
    patients: patients.map(sanitizePatientList),
  });
});

const getPatientById = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)
    .populate("createdBy", "name role")
    .populate("clinicalNotes.createdBy", "name role")
    .populate("evolutions.createdBy", "name role")
    .populate("walletCoupons");

  if (!patient || !patient.isActive)
    return next(new AppError("Paciente no encontrado", 404));

  sendResponse(res, 200, patient);
});

const updatePatient = asyncHandler(async (req, res, next) => {
  const { clinicalNote, ...updateData } = req.body;
  const patient = await Patient.findById(req.params.id);

  if (!patient) return next(new AppError("Paciente no encontrado", 404));

  if (clinicalNote) {
    patient.clinicalNotes.push({ note: clinicalNote, createdBy: req.user._id });
  }

  // 🌟 MEJORA: Solo intentamos mergear si AMBOS son objetos reales
  Object.keys(updateData).forEach((key) => {
    const isObject = (val) =>
      val && typeof val === "object" && !Array.isArray(val);

    if (isObject(updateData[key]) && isObject(patient[key])) {
      patient[key] = {
        ...(patient[key].toObject?.() || patient[key]),
        ...updateData[key],
      };
    } else {
      // Para patientType, name, phone, email, etc.
      patient[key] = updateData[key];
    }
  });

  await patient.save();
  sendResponse(res, 200, patient, "Paciente actualizado correctamente");
});

const addEvolution = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return next(new AppError("Paciente no encontrado", 404));

  const newEvolution = {
    ...req.body,
    createdBy: req.user._id,
    createdAt: new Date(),
  };

  patient.evolutions.push(newEvolution);

  if (
    typeof req.body.diagnosis === "string" &&
    req.body.diagnosis.toUpperCase().includes("CIRUGIA")
  ) {
    patient.patientType = "SURGERY";
  }

  await patient.save();

  // 🌟 OBTENER EL ID DE LA EVOLUCIÓN RECIÉN CREADA
  const addedEvolution = patient.evolutions[patient.evolutions.length - 1];

  // 🤖 AUTOMATIZACIÓN WHATSAPP: Link de firma de Evolución (con token seguro)
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const signToken = await generateSignatureToken(patient._id, String(addedEvolution._id), "EVOLUTION");
  const signLink = `${baseUrl}/public/${signToken}`;
  const firstName = patient.name.split(" ")[0];

  await sendWA(
    patient.phone,
    `Hola ${firstName}, finalizamos tu consulta en Sbeltic con éxito. ✨\n\nPor favor revisa y firma tu nota médica aquí:\n${signLink}`,
  );

  sendResponse(res, 201, patient, "Evolución registrada correctamente");
});

const deletePatient = asyncHandler(async (req, res, next) => {
  await Patient.findByIdAndUpdate(req.params.id, { isActive: false });
  sendResponse(res, 200, null, "Paciente desactivado correctamente");
});

// 🔑 Generar token de firma on-demand (para botón WhatsApp del frontend)
const requestSignatureToken = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { targetId, type } = req.body;

  if (!["HISTORY", "EVOLUTION"].includes(type)) {
    return next(new AppError("Tipo de firma inválido", 400));
  }

  const effectiveTargetId = type === "HISTORY" ? id : targetId;
  if (!effectiveTargetId) {
    return next(new AppError("Se requiere targetId para firmas de evolución", 400));
  }

  const token = await generateSignatureToken(id, effectiveTargetId, type);
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const signLink = `${baseUrl}/public/${token}`;

  sendResponse(res, 200, { signLink }, "Link de firma generado");
});

// 🔑 Generar enlace de formulario de historial médico (solo SURGERY y LEAD)
const generateMedicalHistoryToken = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const patient = await Patient.findById(id);
  if (!patient || !patient.isActive)
    return next(new AppError("Paciente no encontrado", 404));

  if (!["SURGERY", "LEAD"].includes(patient.patientType)) {
    return next(
      new AppError(
        "El formulario de historial médico solo aplica para pacientes de tipo Cirugía o Cotización",
        400,
      ),
    );
  }

  const token = await generateSignatureToken(
    patient._id,
    String(patient._id),
    "MEDICAL_HISTORY_FORM",
    1,
  );
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const signLink = `${baseUrl}/paciente/historial/${token}`;

  sendResponse(res, 200, { signLink }, "Enlace de historial médico generado");
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  addEvolution,
  deletePatient,
  requestSignatureToken,
  generateMedicalHistoryToken,
};
