import AppError from "../utils/appError.js";

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 🛡️ Blindaje contra req.user nulo
    if (!req.user) {
      return next(new AppError("Usuario no autenticado", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("No tienes permiso para realizar esta acción", 403),
      );
    }

    next();
  };
};

export default authorizeRole;
