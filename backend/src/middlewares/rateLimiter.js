import rateLimit from "express-rate-limit";

// 🛡️ Limitador general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "fail",
    message:
      "Demasiadas peticiones desde esta IP. Intenta nuevamente en 15 minutos.",
  },
});

// 🛡️ Limitador para login
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 🔥 IMPORTANTE
  message: {
    success: false,
    status: "fail",
    message:
      "Demasiados intentos de inicio de sesión. Intenta nuevamente en 1 hora.",
  },
});
