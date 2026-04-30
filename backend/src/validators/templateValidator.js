import { z } from "zod";

const medicationSchema = z.object({
  name: z.string().trim().min(1, "El nombre del medicamento es obligatorio"),
  presentation: z.string().trim().optional().or(z.literal("")),
  dose: z.string().trim().optional().or(z.literal("")),
  route: z.string().trim().optional().or(z.literal("")),
  frequency: z.string().trim().optional().or(z.literal("")),
  duration: z.string().trim().optional().or(z.literal("")),
});

const createPostOpNoteTemplateSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  body: z.string().trim().min(5, "El cuerpo de la plantilla es obligatorio"),
  procedureTag: z.string().trim().optional().or(z.literal("")),
});

const updatePostOpNoteTemplateSchema = createPostOpNoteTemplateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

const createPrescriptionTemplateSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  procedureTag: z.string().trim().optional().or(z.literal("")),
  medications: z
    .array(medicationSchema)
    .min(1, "Agrega al menos un medicamento"),
  generalIndications: z.string().optional().or(z.literal("")),
});

const updatePrescriptionTemplateSchema = createPrescriptionTemplateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export {
  medicationSchema,
  createPostOpNoteTemplateSchema,
  updatePostOpNoteTemplateSchema,
  createPrescriptionTemplateSchema,
  updatePrescriptionTemplateSchema,
};
