import { z } from "zod";
import { objectIdSchema } from "./common.js";

// 📣 Campaña de difusión: mensaje libre + pacientes destinatarios.
export const createBroadcastSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "El mensaje de la campaña es obligatorio")
      .max(1024, "El mensaje no puede exceder 1024 caracteres"),
    patientIds: z
      .array(objectIdSchema)
      .min(1, "Selecciona al menos un paciente"),
  })
  .strict();

// Middleware de validación para la ruta
export const validateCreateBroadcast = (req, res, next) => {
  const result = createBroadcastSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      message: result.error.issues.map((e) => e.message).join(", "),
    });
  }

  req.body = result.data;
  next();
};
