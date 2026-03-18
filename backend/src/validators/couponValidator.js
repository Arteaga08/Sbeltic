import { z } from "zod";
import { objectIdSchema } from "./common.js"; // Tu validador de Mongo IDs

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3).toUpperCase(),
    type: z.enum(["WELCOME", "REFERRAL", "SEASONAL", "CLEARANCE"]),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.number().positive(),

    // 🌟 AQUÍ ESTÁ EL CAMPO QUE FALTABA (El pase VIP)
    whatsappMessageTemplate: z
      .string()
      .min(1, "El mensaje de WhatsApp es obligatorio"),

    // Configuración Global
    minPurchase: z.number().nonnegative().default(0),
    maxRedemptions: z.number().int().positive().default(1),
    maxUsesPerUser: z.number().int().positive().default(1),
    isCumulative: z.boolean().default(false),
    applicableCategory: z.string().trim().toUpperCase().optional(),

    expiresAt: z.coerce.date().refine((date) => date > new Date(), {
      message: "La fecha de expiración debe ser en el futuro",
    }),
    isActive: z.boolean().default(true),

    // 🎯 Configuraciones Específicas
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

    // 📅 Programación de envío
    schedule: z
      .object({
        frequency: z.enum(["ONCE", "WEEKLY", "MONTHLY", "AUTO"]).default("ONCE"),
        sendHour: z.number().int().min(0).max(23).default(8),
        dayOfWeek: z.number().int().min(0).max(6).optional(),
        dayOfMonth: z.number().int().min(1).max(31).optional(),
        triggerEvent: z
          .enum(["MANUAL", "ON_NEW_PATIENT", "ON_LOW_STOCK", "ON_APPOINTMENT_COMPLETE"])
          .default("MANUAL"),
        delayDays: z.number().int().nonnegative().default(0),
      })
      .optional(),
  })
  .strict();

// Middleware de validación para la ruta
export const validateCreateCoupon = (req, res, next) => {
  const result = createCouponSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      // 🌟 CAMBIO CLAVE: Usamos result.error.issues en lugar de errors para evitar el crasheo del map
      message: result.error.issues.map((e) => e.message).join(", "),
    });
  }

  req.body = result.data;
  next();
};
