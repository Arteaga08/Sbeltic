import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3).toUpperCase(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.number().positive(),
    referredBy: objectIdSchema.optional(),
    minPurchase: z.number().nonnegative().default(0),
    maxRedemptions: z.number().int().positive().default(1),
    applicableCategory: z.string().trim().toUpperCase().optional(),
    expiresAt: z.coerce.date().refine((date) => date > new Date(), {
      message: "Expiration must be in the future",
    }),
    isActive: z.boolean().default(true),
  })
  .strict();

// Middleware de validación para la ruta
export const validateCreateCoupon = (req, res, next) => {
  const result = createCouponSchema.safeParse(req.body);
  if (!result.success)
    return res
      .status(400)
      .json({
        status: "fail",
        message: result.error.errors.map((e) => e.message).join(", "),
      });
  req.body = result.data;
  next();
};
