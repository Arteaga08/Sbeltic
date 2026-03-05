import { z } from "zod";
import { objectIdSchema } from "./common.js";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const createProductSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre es demasiado corto"),
    sku: optionalString,
    description: optionalString,
    category: z.enum(["RETAIL", "INSUMO", "EQUIPO"]),
    supplierId: objectIdSchema.optional(),
    minStockAlert: z.coerce.number().int().nonnegative().default(5),
    unit: z.string().trim().min(1).max(10).default("pza"),
    isTrackable: z.boolean().default(true),
  })
  .strict();

const updateProductSchema = createProductSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export { createProductSchema, updateProductSchema };
