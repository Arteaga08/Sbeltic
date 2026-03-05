import { z } from "zod";
import mongoose from "mongoose";

// Helper para validar que los IDs sean válidos para MongoDB
const objectIdValid = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "El ID proporcionado no es un ObjectId válido de MongoDB",
  });

const createWaitlistSchema = {
  body: z.object({
    patientId: objectIdValid,
    doctorId: objectIdValid,
    desiredDate: z.string().datetime({
      message:
        "La fecha debe tener un formato ISO 8601 válido (ej. 2026-03-05T10:00:00.000Z)",
    }),
  }),
};

const updateWaitlistSchema = {
  params: z.object({
    id: objectIdValid,
  }),
  body: z.object({
    status: z.enum(["WAITING", "NOTIFIED", "RESOLVED"], {
      errorMap: () => ({
        message: "El estado solo puede ser WAITING, NOTIFIED o RESOLVED",
      }),
    }),
  }),
};

// --- EXPORTACIÓN AGRUPADA ---
export { createWaitlistSchema, updateWaitlistSchema };
