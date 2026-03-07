import { z } from "zod";

const createCategorySchema = z
  .object({
    name: z
      .string({ required_error: "El nombre de la categoría es obligatorio" })
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .trim(),
    description: z.string().trim().optional(),
    type: z.enum(["RETAIL", "INSUMO", "EQUIPO", "ALL"]).optional(),
  })
  .strict();

// Para el PUT, todos los campos son opcionales pero deben respetar las reglas si se envían
const updateCategorySchema = createCategorySchema.partial().strict();

export { createCategorySchema, updateCategorySchema };
