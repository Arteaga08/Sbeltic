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
      const humanErrors = (error.issues || error.errors)?.map((err) => {
        const field = err.path ? err.path.join(".") : "campo desconocido";
        return `${field}: ${err.message}`;
      }) || ["Error de validación desconocido"];

      const err = new AppError("Errores de validación: " + humanErrors.join(" | "), 400);
      err.errors = humanErrors;
      return next(err);
    }
    console.log("Error no identificado en middleware:", error);
    return next(error);
  }
};
