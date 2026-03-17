import Patient from "../models/clinical/Patient.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

// 🤖 UTILIDAD MOCK PARA WHATSAPP (Reemplazar con API real en el futuro)
// Puedes mover esto a un archivo utils/whatsapp.js cuando contrates la API
const sendWA = async (phone, message) => {
  console.log(`\n========================================`);
  console.log(`📱 [WA-AUTOMATION] Enviando WhatsApp a: ${phone}`);
  console.log(`💬 Mensaje: \n${message}`);
  console.log(`========================================\n`);
  // Aquí irá tu fetch a la API de WhatsApp (GreenAPI, Twilio, Meta API, etc.)
};

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

  // 🤖 AUTOMATIZACIÓN WHATSAPP: Link de firma de Historia Clínica
  // Usamos localhost como fallback por si no tienes la variable de entorno configurada aún
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const signLink = `${baseUrl}/public/${patient._id}`;

  await sendWA(
    patient.phone,
    `¡Bienvenido a Sbeltic, ${firstName}! 🏥\n\nPara completar tu registro, por favor firma tu historia clínica digital en el siguiente enlace seguro:\n${signLink}`,
  );

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

  if (req.body.diagnosis?.toUpperCase().includes("CIRUGIA")) {
    patient.patientType = "SURGERY";
  }

  await patient.save();

  // 🌟 OBTENER EL ID DE LA EVOLUCIÓN RECIÉN CREADA
  const addedEvolution = patient.evolutions[patient.evolutions.length - 1];

  // 🤖 AUTOMATIZACIÓN WHATSAPP: Link de firma de Evolución
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const signLink = `${baseUrl}/public/${addedEvolution._id}`;
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

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  addEvolution,
  deletePatient,
};
