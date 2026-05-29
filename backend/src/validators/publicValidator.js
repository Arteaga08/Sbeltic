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
  privacyConsent: z
    .object({
      accepted: z.literal(true, {
        errorMap: () => ({
          message: "Debes aceptar el Aviso de Privacidad para continuar",
        }),
      }),
      acceptedAt: z.string().datetime(),
      version: z.string().min(1),
    })
    .required(),
});
