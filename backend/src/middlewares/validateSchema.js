import { ZodError } from "zod";

/**
 * 🛡️ VALIDADOR DE ESQUEMAS (ZOD)
 * Centraliza la validación de Body, Params y Query.
 */
export const validateSchema = (schemas) => (req, res, next) => {
  try {
    // 1. Validar Body
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    // 2. Validar Params
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    // 3. Validar Query (Añadimos esto para filtros de búsqueda)
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }

    return next(); // 👈 IMPORTANTE: Aseguramos el return para cortar ejecución
  } catch (error) {
    if (error instanceof ZodError) {
      // Si es error de Zod, respondemos 400 directamente
      return res.status(400).json({
        success: false,
        status: "fail",
        message: "Error de validación de datos",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Si es otro tipo de error, se lo pasamos al errorHandler global
    return next(error);
  }
};
