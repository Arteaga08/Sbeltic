import { z } from "zod";
import { objectIdSchema } from "../validators/common.js";

const phoneRegex = /^\+?[1-9]\d{9,14}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const createPatientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres"),
    phone: z.string().trim().regex(phoneRegex, "Formato de teléfono inválido"),
    birthDate: optionalString,
    address: optionalString,
    allowsWhatsAppNotifications: z.boolean().optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    occupation: optionalString,
    educationLevel: z
      .enum([
        "POSGRADO",
        "CARRERA",
        "BACHILLERATO",
        "SECUNDARIA",
        "PRIMARIA",
        "SIN ESTUDIOS",
        "OTRO",
      ])
      .optional(),
    ethnicity: z
      .enum(["MESTIZO", "INDIGENA", "AFROMERICANO", "OTRO"])
      .optional(),
    religion: optionalString,
    referredBy: objectIdSchema.optional(),
    medicalHistory: z
      .object({
        bloodType: z
          .enum([
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-",
            "DESCONOCIDO",
          ])
          .optional(),
        allergies: z
          .object({
            food: optionalString,
            medications: optionalString,
            others: optionalString,
          })
          .optional(),
        chronicDiseases: z
          .object({
            hypertension: z.boolean().optional(),
            diabetes: z.boolean().optional(),
            thyroid: z.boolean().optional(),
            kidney: z.boolean().optional(),
            liver: z.boolean().optional(),
            other: optionalString,
          })
          .optional(),
        currentMedications: optionalString,
        systemReview: z
          .object({
            heart: optionalString,
            circulation: optionalString,
            lungs: optionalString,
            skin: optionalString,
          })
          .optional(),
      })
      .optional(),
    clinicalNote: optionalString,
  })
  .strict();

const updatePatientSchema = createPatientSchema.partial().strict();

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { createPatientSchema, updatePatientSchema };
