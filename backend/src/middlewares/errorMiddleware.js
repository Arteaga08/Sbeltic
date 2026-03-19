export const errorHandler = (err, req, res, next) => {
  console.error("❌ ERROR DETECTADO EN SBELTIC:");
  console.error("Mensaje:", err.message);
  console.error("Stack:", err.stack); // 👈 Esto nos dirá exactamente la línea del error
  console.error("Cuerpo de la petición (body):", req.body);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // ====== DEVELOPMENT ======
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // ====== PRODUCTION ======
  let error = {
    ...err,
    message: err.message,
  };

  // 🔹 MongoDB: Duplicate field
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `The ${field} is already in use.`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // 🔹 MongoDB: Invalid ObjectId
  if (err.name === "CastError") {
    error.message = `Invalid format for field: ${err.path}`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // 🔹 Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = `Invalid input data. ${messages.join(". ")}`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // 🔹 Zod Validation Error
  if (err.errors && Array.isArray(err.errors)) {
    error.message = err.errors.map((e) => e.message).join(". ");
    error.statusCode = 400;
    error.isOperational = true;
  }

  // 🔹 Conflict (409) — ej. doble reservación detectada en pre-save
  if (err.statusCode === 409) {
    error.statusCode = 409;
    error.isOperational = true;
  }

  // 🔹 JWT Errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token. Please log in again.";
    error.statusCode = 401;
    error.isOperational = true;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Your token has expired. Please log in again.";
    error.statusCode = 401;
    error.isOperational = true;
  }

  // ====== RESPONSE ======
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
    });
  }

  // 🔥 Error NO controlado (bug)
  console.error("💥 SYSTEM ERROR:", err);

  return res.status(500).json({
    success: false,
    status: "error",
    message: "An unexpected error occurred. Please try again later.",
  });
};
