/**
 * WhatsApp Service — Meta Cloud API Integration
 *
 * Modo de operación controlado por WHATSAPP_MODE:
 * - "development" (default): Loguea mensajes en consola + envía vía API sandbox
 * - "production": Envía mensajes reales a pacientes
 *
 * Variables de entorno requeridas:
 * - WHATSAPP_MODE=development
 * - WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
 * - WHATSAPP_ACCESS_TOKEN=tu_access_token
 * - WHATSAPP_VERIFY_TOKEN=tu_verify_token (para webhook)
 * - WHATSAPP_APP_SECRET=tu_app_secret (para verificar webhook HMAC)
 */

import crypto from "crypto";

const WHATSAPP_MODE = process.env.WHATSAPP_MODE || "development";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`;

/**
 * Envía un mensaje de texto libre por WhatsApp.
 * En modo development, loguea en consola y solo envía si hay credenciales configuradas.
 */
export const sendWhatsAppMessage = async (phone, message) => {
  // Siempre loguear para visibilidad
  console.log(`\n========================================`);
  console.log(`📱 [WA-${WHATSAPP_MODE.toUpperCase()}] Enviando a: ${phone}`);
  console.log(`💬 Mensaje: \n${message}`);
  console.log(`========================================\n`);

  // Si no hay credenciales configuradas, solo loguear
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.log("⚠️ [WA] Credenciales no configuradas — mensaje solo logueado");
    return { success: true, mode: "mock" };
  }

  try {
    const response = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/[^\d]/g, ""),
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [WA] Error de API:", data.error?.message || data);
      return { success: false, error: data.error };
    }

    console.log(`✅ [WA] Mensaje enviado. ID: ${data.messages?.[0]?.id}`);
    return { success: true, messageId: data.messages?.[0]?.id, mode: WHATSAPP_MODE };
  } catch (error) {
    console.error("❌ [WA] Error de red:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía un mensaje con template pre-aprobado de Meta.
 * Útil para mensajes fuera de la ventana de 24h.
 */
export const sendWhatsAppTemplate = async (phone, templateName, languageCode = "es", components = []) => {
  console.log(`📱 [WA-TEMPLATE] ${templateName} → ${phone}`);

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.log("⚠️ [WA] Credenciales no configuradas — template solo logueado");
    return { success: true, mode: "mock" };
  }

  try {
    const response = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/[^\d]/g, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [WA-TEMPLATE] Error:", data.error?.message || data);
      return { success: false, error: data.error };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("❌ [WA-TEMPLATE] Error de red:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica la firma HMAC del webhook de Meta.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!process.env.WHATSAPP_APP_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  return `sha256=${expectedSignature}` === signature;
};
