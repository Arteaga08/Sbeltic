import mongoose from "mongoose";
import AppError from "../utils/appError.js";

/**
 * Middleware para validar que el ID en los parámetros de la ruta
 * sea un ObjectId válido de MongoDB.
 */
const validateObjectId = (req, res, next) => {
  const id = req.params.id;

  // Si hay un ID en la ruta, verificamos que tenga el formato correcto
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return next(
      new AppError("Invalid ID format. Must be a valid MongoDB ObjectId.", 400),
    );
  }

  next();
};

export default validateObjectId;
