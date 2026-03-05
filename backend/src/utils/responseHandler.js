/**
 * 🚀 Utilidad global para enviar respuestas JSON consistentes.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Number} statusCode - Código de estado HTTP (200, 201, etc).
 * @param {any} data - Los datos que queremos enviar (objeto, array, etc).
 * @param {String} message - Mensaje informativo para el cliente.
 */
export const sendResponse = (res, statusCode, data, message = "Success") => {
  // Determinamos el estado basado en el código HTTP
  const status = statusCode >= 400 ? "fail" : "success";

  res.status(statusCode).json({
    success: statusCode < 400,
    status,
    message,
    data,
  });
};
