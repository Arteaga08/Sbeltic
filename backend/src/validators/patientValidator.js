import { z } from "zod";
import { objectIdSchema } from "../validators/common.js";

const phoneRegex = /^\+?[1-9]\d{9,14}$/;

const createPatientSchema = z.object({
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().trim().regex(phoneRegex, "Formato de teléfono inválido"),
  email: z.string().trim().email().optional().or(z.literal("")),
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
  
  dateOfBirth: z.coerce.date().optional(),
  birthDate: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  educationLevel: z.string().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  referredBy: z.any().optional(), // Cambiado a any por si llega el objeto poblado
  clinicalNote: z.string().optional(),
  historySignature: z.string().optional(),
}); // 🚀 QUITAMOS .strict() para permitir el paso de datos del sistema

const updatePatientSchema = createPatientSchema.partial().strict();

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

export { createPatientSchema, updatePatientSchema, createEvolutionSchema };
