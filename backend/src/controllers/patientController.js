import Patient from "../models/clinical/Patient.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

const sanitizePatientList = (p) => ({
  _id: p._id,
  name: p.name,
  phone: p.phone,
  email: p.email,
  isActive: p.isActive,
  referralCode: p.referralCode,
});

const createPatient = asyncHandler(async (req, res, next) => {
  const { phone, name } = req.body;

  // 1. Validamos y limpiamos el teléfono de forma segura
  const safePhone =
    typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";

  if (!safePhone) {
    return next(new AppError("El formato del teléfono es inválido", 400));
  }

  const patientExists = await Patient.findOne({ phone: safePhone });
  if (patientExists)
    return next(new AppError("El teléfono ya está registrado", 400));

  // 2. Generación segura del código de referido
  // Validamos que 'name' sea string para usar .split()
  const safeName = typeof name === "string" ? name.trim() : "PACIENTE";
  const firstName = safeName.split(" ")[0].toUpperCase();

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const referralCode = `${firstName}-${randomDigits}`;

  const patient = new Patient({
    ...req.body,
    phone: safePhone,
    referralCode,
    createdBy: req.user._id,
  });

  await patient.save();
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
    .populate("walletCoupons");

  if (!patient || !patient.isActive)
    return next(new AppError("Paciente no encontrado", 404));

  sendResponse(res, 200, patient);
});

const updatePatient = asyncHandler(async (req, res, next) => {
  const { clinicalNote, ...updateData } = req.body;
  const patient = await Patient.findById(req.params.id);

  if (!patient) return next(new AppError("Paciente no encontrado", 404));

  // Si hay una nota nueva, la pusheamos al historial
  if (clinicalNote) {
    patient.clinicalNotes.push({
      note: clinicalNote,
      createdBy: req.user._id,
    });
  }

  // Actualización profunda para objetos anidados (medicalHistory, etc)
  Object.keys(updateData).forEach((key) => {
    if (
      typeof updateData[key] === "object" &&
      !Array.isArray(updateData[key]) &&
      updateData[key] !== null
    ) {
      patient[key] = { ...patient[key], ...updateData[key] };
    } else {
      patient[key] = updateData[key];
    }
  });

  await patient.save();
  sendResponse(res, 200, patient, "Paciente actualizado correctamente");
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
  deletePatient,
};
