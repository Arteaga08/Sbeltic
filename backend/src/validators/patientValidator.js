import { z } from "zod";
import { objectIdSchema } from "../validators/common.js";

const phoneRegex = /^\+?[1-9]\d{9,14}$/;

const createPatientSchema = z.object({
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().trim().regex(phoneRegex, "Formato de teléfono inválido"),
  email: z.string().trim().email().or(z.literal("")).nullish(),
  allowsWhatsAppNotifications: z.boolean().optional(),
  patientType: z
    .enum(["SPA", "INJECTION", "LEAD", "SURGERY", "POST_OP", "OTHER"])
    .default("SPA"),

  // 🌟 Mantenemos ANY para flexibilidad, pero permitimos que lleguen nulos
  medicalHistory: z.object({
    identification: z.any().optional(),
    allergies: z.any().optional(),
    vital: z.any().optional(),
    comorbidities: z.any().optional(),
    family: z.any().optional(),
    gyneco: z.any().optional(),
    systems: z.any().optional(),
    pathological: z.any().optional(),
    habits: z.any().optional(),
    currentCondition: z.string().optional().or(z.literal("")),
  }).optional(),

  // 🌟 Añadimos los campos que el sistema genera para que no choquen
  isProfileComplete: z.boolean().optional(),
  walletBalance: z.coerce.number().optional(),
  referralCode: z.string().optional(),
  isActive: z.boolean().optional(),
  
  dateOfBirth: z.coerce.date().nullish(),
  birthDate: z.string().or(z.literal("")).nullish(),
  address: z.string().or(z.literal("")).nullish(),
  occupation: z.string().or(z.literal("")).nullish(),
  educationLevel: z.string().nullish(),
  ethnicity: z.string().nullish(),
  religion: z.string().nullish(),
  referredBy: z.any().nullish(), // Cambiado a any por si llega el objeto poblado
  clinicalNote: z.string().nullish(),
  historySignature: z.string().nullish(),
}); // 🚀 QUITAMOS .strict() para permitir el paso de datos del sistema

const updatePatientSchema = createPatientSchema.partial();

// 🩺 ESQUEMA PARA EVOLUCIONES (CONSULTAS)
const createEvolutionSchema = z.object({
  vitals: z.any().optional(),
  physicalExam: z.any().optional(),
  labResults: z.string().optional(),
  diagnosis: z.string().trim().min(5, "El diagnóstico es obligatorio"),
  prognosis: z.string().optional(),
  indications: z.string().trim().min(5, "Las indicaciones son obligatorias"),
  patientSignature: z.string().optional(),
  doctorSignature: z.string().optional(),
  doctorName: z.string().optional(),
  doctorLicense: z.string().optional(),
});

// 📝 NOTAS POST-OPERATORIAS (anidadas en Patient)
const createPostOpNoteSchema = z.object({
  title: z.string().trim().min(3, "El título es obligatorio"),
  body: z.string().trim().min(5, "El contenido es obligatorio"),
  templateId: objectIdSchema.optional(),
});

// 💊 RECETAS MÉDICAS (anidadas en Patient)
const prescriptionMedicationSchema = z.object({
  name: z.string().trim().min(1, "El nombre del medicamento es obligatorio"),
  presentation: z.string().trim().optional().or(z.literal("")),
  dose: z.string().trim().optional().or(z.literal("")),
  route: z.string().trim().optional().or(z.literal("")),
  frequency: z.string().trim().optional().or(z.literal("")),
  duration: z.string().trim().optional().or(z.literal("")),
});

const createPrescriptionSchema = z.object({
  title: z.string().trim().min(3, "El título es obligatorio"),
  medications: z
    .array(prescriptionMedicationSchema)
    .min(1, "Agrega al menos un medicamento"),
  generalIndications: z.string().optional().or(z.literal("")),
  templateId: objectIdSchema.optional(),
  doctorName: z.string().optional().or(z.literal("")),
  doctorLicense: z.string().optional().or(z.literal("")),
  doctorSignature: z.string().optional().or(z.literal("")),
});

// 📸 FOTOS ANTES/DESPUÉS (multipart, body trae strings — no validamos `file` aquí)
const uploadPhotoBodySchema = z.object({
  type: z.enum(["BEFORE", "AFTER", "POST_OP", "EVOLUCION"]),
  date: z.coerce.date({ message: "Fecha inválida" }),
  caption: z.string().trim().max(500).optional().default(""),
});

const photoFilenameSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de paciente inválido"),
  filename: z
    .string()
    .regex(/^[a-f0-9-]{36}-(web|thumb)\.jpg$/, "Nombre de archivo inválido"),
});

const photoIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de paciente inválido"),
  photoId: z.string().regex(/^[a-f\d]{24}$/i, "ID de foto inválido"),
});

export {
  createPatientSchema,
  updatePatientSchema,
  createEvolutionSchema,
  createPostOpNoteSchema,
  createPrescriptionSchema,
  uploadPhotoBodySchema,
  photoFilenameSchema,
  photoIdParamsSchema,
};
