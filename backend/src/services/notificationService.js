/**
 * 📢 SERVICIO DE NOTIFICACIONES
 * Centraliza los canales de salida (Telegram, UI, etc.)
 */
const sendTelegramAlert = async (message, botToken, chatId) => {
  try {
    // Aquí irá el fetch a la API de Telegram que configuraremos
    console.log(`[Telegram Alert]: ${message}`);
    // const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    // await fetch(url, { ... });
  } catch (error) {
    console.error("Error enviando alerta a Telegram:", error);
  }
};

export { sendTelegramAlert };
