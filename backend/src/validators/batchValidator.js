import { z } from "zod";
import { objectIdSchema } from "./common.js";

// ==========================================
// 1. ESQUEMAS DE ZOD
// ==========================================

const createBatchSchema = z
  .object({
    productId: objectIdSchema,
    supplierId: objectIdSchema.optional(),

    batchNumber: z.string().trim().min(1, "El número de lote es obligatorio"),

    // Coerción para convertir el string de fecha en objeto Date
    expiryDate: z.coerce.date().refine((date) => date > new Date(), {
      message: "La fecha de caducidad debe ser en el futuro",
    }),

    initialQuantity: z.coerce
      .number()
      .int()
      .positive("La cantidad inicial debe ser mayor a 0"),

    purchasePrice: z.coerce
      .number()
      .nonnegative("El precio de compra no puede ser negativo")
      .optional(),
  })
  .strict();

const updateBatchSchema = z
  .object({
    batchNumber: z.string().trim().optional(),
    expiryDate: z.coerce
      .date()
      .refine((date) => date > new Date())
      .optional(),
    purchasePrice: z.coerce.number().nonnegative().optional(),
    status: z.enum(["AVAILABLE", "EMPTY", "EXPIRED"]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// ==========================================
// 2. MIDDLEWARES
// ==========================================

export const validateCreateBatch = (req, res, next) => {
  const result = createBatchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((err) => err.message).join(", "),
    });
  }
  req.body = result.data;
  next();
};

export const validateUpdateBatch = (req, res, next) => {
  const result = updateBatchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((err) => err.message).join(", "),
    });
  }
  req.body = result.data;
  next();
};
