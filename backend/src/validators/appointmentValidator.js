import { z } from "zod";
import { objectIdSchema } from "./common.js";

const CLINIC_OPEN_HOUR = 9;
const CLINIC_CLOSE_HOUR = 21;

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const createAppointmentSchema = z
  .object({
    patientId: objectIdSchema,
    doctorId: objectIdSchema,
    treatmentId: objectIdSchema.optional(),
    treatmentName: z
      .string()
      .trim()
      .min(2, "El nombre del tratamiento es requerido"),
    // 🔥 Agregamos el roomId que faltaba
    roomId: z.enum(["CABINA_1", "CABINA_2", "CABINA_3", "SPA", "CONSULTORIO"], {
      errorMap: () => ({ message: "Selecciona una cabina válida" }),
    }),
    originalQuote: z.number().nonnegative().optional(),
    appliedCoupon: objectIdSchema.optional(),
    duration: z.number().int().min(15).max(240).default(30),
    appointmentDate: z.coerce
      .date()
      .refine((date) => date > new Date(), {
        message: "No puedes agendar en el pasado",
      })
      .refine((date) => date.getDay() !== 0, {
        message: "La clínica cierra los domingos",
      })
      .refine(
        (date) => {
          const hour = date.getHours();
          return hour >= CLINIC_OPEN_HOUR && hour < CLINIC_CLOSE_HOUR;
        },
        { message: "Horario fuera de servicio (9AM - 9PM)" },
      ),
    consumedSupplies: z
      .array(
        z.object({
          productId: objectIdSchema,
          quantity: z.number().int().positive(),
        }),
      )
      .optional(),
    consultationRecord: z
      .object({
        reasonForVisit: optionalString,
        vitalSigns: z
          .object({
            bloodPressure: optionalString,
            heartRate: z.number().optional(),
            temperature: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .strict();

const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .extend({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]),
    couponCode: z.string().trim().toUpperCase().optional(),
    isReminderSent: z.boolean().optional(),
  })
  .strict();

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { createAppointmentSchema, updateAppointmentSchema };
