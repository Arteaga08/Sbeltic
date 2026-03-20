import { z } from "zod";

const ROOM_IDS = ["CABINA_1", "CABINA_2", "CABINA_3", "SPA", "CONSULTORIO", "QUIROFANO"];
const BOT_FLOWS = ["AGENDAR", "COTIZAR", "BOTH", "NONE"];

const createTreatmentCategorySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2, "El slug debe tener al menos 2 caracteres")
      .transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
    roomIds: z.array(z.enum(ROOM_IDS)).default([]),
    botFlow: z.enum(BOT_FLOWS).default("NONE"),
    colorClass: z.string().trim().optional(),
    dotClass: z.string().trim().optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

const updateTreatmentCategorySchema = createTreatmentCategorySchema.partial().strict();

export const validateCreateTreatmentCategory = (req, res, next) => {
  const result = createTreatmentCategorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((e) => e.message).join(", "),
    });
  }
  req.body = result.data;
  next();
};

export const validateUpdateTreatmentCategory = (req, res, next) => {
  const result = updateTreatmentCategorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.errors.map((e) => e.message).join(", "),
    });
  }
  req.body = result.data;
  next();
};
