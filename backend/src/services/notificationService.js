/**
 * 📢 SERVICIO DE NOTIFICACIONES
 * Centraliza los canales de salida (Telegram, UI, etc.)
 */
const sendTelegramAlert = async (message, chatId) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) {
    console.warn("[Telegram Alert]: Bot token o chatId no configurado. Mensaje no enviado.");
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("[Telegram Alert]: Error de API:", data.description);
    }
  } catch (error) {
    console.error("[Telegram Alert]: Error enviando alerta:", error.message);
  }
};

export { sendTelegramAlert };
