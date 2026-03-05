/**
 * 🛡️ SBELTIC CUSTOM SANITIZER
 * Elimina llaves que empiecen con $ o contengan . para evitar NoSQL Injection.
 * Compatible con Express 5 (No intenta sobrescribir getters de solo lectura).
 */
const mongoSanitize = (req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        // Si la llave es peligrosa, la borramos
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          // Si es un objeto anidado, seguimos limpiando
          clean(obj[key]);
        }
      });
    }
  };

  // Sanitizamos el Body y los Params (que son escribibles)
  if (req.body) clean(req.body);
  if (req.params) clean(req.params);

  // Nota: req.query en Express 5 es un getter.
  // Como ya usamos Zod en las rutas, la validación de query está cubierta ahí.

  next();
};

export default mongoSanitize;
