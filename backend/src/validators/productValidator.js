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
    brand: optionalString,
    amount: optionalString,
    description: optionalString,

    category: objectIdSchema,

    purchasePrice: z.coerce.number().nonnegative().optional().default(0),
    salePrice: z.coerce.number().nonnegative().optional().default(0),

    supplierId: objectIdSchema.optional(),
    minStockAlert: z.coerce.number().int().nonnegative().default(5),
    unit: z.string().trim().min(1).max(20).default("unidades"),
    isTrackable: z.boolean().default(true),

    // 📦 CAMPOS DE LOTE INICIAL (Permitimos que pasen)
    initialQuantity: z.coerce.number().nonnegative().optional().default(0),
    batchNumber: optionalString,
    expirationDate: optionalString,
  })
  .strict(); // Mantenemos strict() por seguridad, pero ya conoce todos los campos

const updateProductSchema = createProductSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export { createProductSchema, updateProductSchema };
