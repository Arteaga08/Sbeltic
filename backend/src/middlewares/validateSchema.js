import { z } from "zod";

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
      const humanErrors = error.errors?.map((err) => {
        const field = err.path ? err.path.join(".") : "campo desconocido";
        return `${field}: ${err.message}`;
      }) || ["Error de validación desconocido"];

      return res.status(400).json({
        success: false,
        status: "fail",
        message: "Errores de validación",
        errors: humanErrors,
      });
    }
    console.log("Error no identificado en middleware:", error);
    return next(error);
  }
};
