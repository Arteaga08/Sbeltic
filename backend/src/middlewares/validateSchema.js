import { z } from "zod";
import AppError from "../utils/appError.js";

export const validateSchema = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    return next();
  } catch (error) {
    // 🌟 EL CAMBIO: Usamos z.ZodError
    if (error instanceof z.ZodError) {
      const humanErrors = (error.issues || error.errors)?.map((issue) => {
        // Solo usamos el mensaje (ya viene en español y amigable).
        // Para claves no reconocidas u otros casos sin mensaje útil,
        // mostramos un texto genérico en lenguaje normal.
        if (!issue.message || issue.code === "unrecognized_keys") {
          return "Hay un dato no válido en el formulario";
        }
        return issue.message;
      }) || ["No pudimos validar la información del formulario"];

      const err = new AppError(humanErrors.join(". "), 400);
      err.errors = humanErrors;
      return next(err);
    }
    console.log("Error no identificado en middleware:", error);
    return next(error);
  }
};
