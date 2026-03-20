import { z } from "zod";
import { objectIdSchema } from "./common.js";

// ==========================================
// 1. ESQUEMAS DE ZOD (Las reglas)
// ==========================================

const createTreatmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Treatment name must be at least 2 characters"),
    performerRole: z.enum(["DOCTOR", "RECEPTIONIST", "BOTH"], {
      required_error: "You must specify who can perform this treatment",
    }),
    category: z.string().trim().toUpperCase().min(2, "Category is required"),
    description: z.string().trim().optional(),
    estimatedDuration: z.coerce.number().int().positive().default(30),
    suggestedTouchUpDays: z.coerce.number().int().nonnegative().optional(),
    promotionalPrice: z.coerce.number().nonnegative().optional(),
    promoExpiresAt: z.coerce.date().optional(),
    suggestedMaterials: z
      .array(
        z.object({
          productId: objectIdSchema,
          suggestedQuantity: z.number().positive().min(1),
        }),
      )
      .optional(),
    defaultRoomId: z
      .enum(["CABINA_1", "CABINA_2", "CABINA_3", "SPA", "CONSULTORIO", "QUIROFANO"])
      .optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

const updateTreatmentSchema = createTreatmentSchema.partial().strict();

// ==========================================
// 2. MIDDLEWARES (Los que exportamos a la ruta)
// ==========================================

export const validateCreateTreatment = (req, res, next) => {
  const result = createTreatmentSchema.safeParse(req.body);

  if (!result.success) {
    // Si falla, detenemos la petición y mostramos los errores limpios
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((err) => err.message).join(", "),
    });
  }

  // Si pasa, reescribimos el body con los datos limpios (y en mayúsculas)
  req.body = result.data;
  next();
};

export const validateUpdateTreatment = (req, res, next) => {
  const result = updateTreatmentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((err) => err.message).join(", "),
    });
  }

  req.body = result.data;
  next();
};
