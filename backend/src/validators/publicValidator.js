import { z } from "zod";

export const publicSignatureSchema = z.object({
  signature: z.string().min(100, "La firma es inválida o demasiado corta"),
});

const medicalHistorySectionSchema = z.any().optional();

export const medicalHistorySubmitSchema = z.object({
  medicalHistory: z
    .object({
      identification: medicalHistorySectionSchema,
      allergies: medicalHistorySectionSchema,
      vital: medicalHistorySectionSchema,
      comorbidities: medicalHistorySectionSchema,
      family: medicalHistorySectionSchema,
      gyneco: medicalHistorySectionSchema,
      systems: medicalHistorySectionSchema,
      pathological: medicalHistorySectionSchema,
      habits: medicalHistorySectionSchema,
      currentCondition: medicalHistorySectionSchema,
    })
    .optional(),
  historySignature: z
    .string()
    .min(100, "La firma es inválida o demasiado corta")
    .optional(),
});
