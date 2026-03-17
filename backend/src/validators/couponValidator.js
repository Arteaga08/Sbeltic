import { z } from "zod";
import { objectIdSchema } from "./common.js"; // Tu validador de Mongo IDs

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3).toUpperCase(),
    type: z.enum(["WELCOME", "REFERRAL", "SEASONAL", "CLEARANCE"]), // 🌟 NUEVO
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.number().positive(),

    // Configuración Global
    minPurchase: z.number().nonnegative().default(0),
    maxRedemptions: z.number().int().positive().default(1),
    maxUsesPerUser: z.number().int().positive().default(1), // 🌟 NUEVO
    isCumulative: z.boolean().default(false), // 🌟 NUEVO
    applicableCategory: z.string().trim().toUpperCase().optional(),

    expiresAt: z.coerce.date().refine((date) => date > new Date(), {
      message: "La fecha de expiración debe ser en el futuro",
    }),
    isActive: z.boolean().default(true),

    // 🎯 Configuraciones Específicas (Opcionales dependiendo del 'type')
    referralConfig: z
      .object({
        ownerId: objectIdSchema,
        maxShares: z.number().int().nonnegative().default(0),
      })
      .optional(),

    clearanceConfig: z
      .object({
        applicableProducts: z.array(objectIdSchema).min(1),
      })
      .optional(),
  })
  .strict();

// Middleware de validación para la ruta (Intacto)
export const validateCreateCoupon = (req, res, next) => {
  const result = createCouponSchema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((e) => e.message).join(", "),
    });
  req.body = result.data;
  next();
};
