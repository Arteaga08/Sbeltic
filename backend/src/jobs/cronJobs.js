import cron from "node-cron";
import {
  sendReferralInvitations,
  sendTouchUpReminders,
  sendHourlyReminders,
  processScheduledCoupons,
} from "../services/automationService.js";
import { startInventoryCron } from "./inventoryCron.js"; // 🔥 Importamos el de Inventario

const initCronJobs = () => {
  // --- 📦 CRONS DE INVENTARIO ---
  // Ejecuta la lógica delegada en su propio archivo (Alertas Telegram)
  startInventoryCron();

  // --- ⏰ CRONS DE MARKETING Y CITAS ---
  // RELOJ DIARIO: Se ejecuta todos los días a las 08:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("🌅 [CRON] Iniciando tareas diarias de marketing (8:00 AM)...");
    await sendReferralInvitations();
    await sendTouchUpReminders();
    await processScheduledCoupons();
  });

  // RELOJ RÁPIDO: Se ejecuta cada 15 minutos
  cron.schedule("*/15 * * * *", async () => {
    console.log("⚡ [CRON] Revisando citas próximas (1 hora antes)...");
    await sendHourlyReminders();
  });
};

export default initCronJobs;
