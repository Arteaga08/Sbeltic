import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js"; // 👈 IMPORTANTE
import AppError from "../utils/appError.js";

const checkAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("No autorizado, token no encontrado", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscamos al usuario y lo inyectamos en la petición
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new AppError("El usuario de este token ya no existe", 401));
    }

    req.user = user;
    next(); // 👈 El 'next' ahora es seguro gracias al asyncHandler
  } catch (error) {
    return next(new AppError("Token inválido o expirado", 401));
  }
});

export default checkAuth;
