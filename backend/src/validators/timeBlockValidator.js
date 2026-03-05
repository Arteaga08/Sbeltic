import { z } from "zod";
import { objectIdSchema } from "./common.js";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const createTimeBlockSchema = z
  .object({
    doctorId: objectIdSchema,
    startTime: z.coerce.date().refine((date) => date > new Date(), {
      message: "Start time must be in the future",
    }),
    endTime: z.coerce.date(),
    type: z
      .enum(["LUNCH", "VACATION", "MEETING", "PERSONAL", "OTHER"])
      .default("PERSONAL"),
    reason: optionalString,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .strict();

export const updateTimeBlockSchema = createTimeBlockSchema.partial().strict();
