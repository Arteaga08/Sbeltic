import { z } from "zod";
import { objectIdSchema } from "./common.js";

// Validación de query para reportes mensuales (?month=&year=)
const now = new Date();

const statementQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).default(now.getMonth() + 1),
    year: z.coerce.number().int().min(2000).max(2100).default(now.getFullYear()),
    collaboratorId: objectIdSchema.optional(),
  })
  .strip();

const summaryQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).default(now.getMonth() + 1),
    year: z.coerce.number().int().min(2000).max(2100).default(now.getFullYear()),
  })
  .strip();

// Registrar / confirmar una ganancia para una cita
const recordEarningSchema = z
  .object({
    appointmentId: objectIdSchema,
    earnedAmount: z.coerce.number().min(0),
    commissionValue: z.coerce.number().min(0).optional(),
    commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  })
  .strict();

// Ajustar el monto ganado de un registro existente
const updateEarningSchema = z
  .object({
    earnedAmount: z.coerce.number().min(0),
    commissionValue: z.coerce.number().min(0).optional(),
    commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  })
  .strict();

export {
  statementQuerySchema,
  summaryQuerySchema,
  recordEarningSchema,
  updateEarningSchema,
};
