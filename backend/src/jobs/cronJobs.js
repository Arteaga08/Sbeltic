import cron from "node-cron";
import {
  sendReferralInvitations,
  sendTouchUpReminders,
  sendDailyReminders,
  sendPostOperativeCare,
  sendFollowUpReminders,
  expireWaitlistNotifications,
  processScheduledCoupons,
  sendBirthdayCoupons,
  sendMaintenanceCoupons,
} from "../services/automationService.js";
import { startInventoryCron } from "./inventoryCron.js"; // 🔥 Importamos el de Inventario

const runTask = async (name, fn) => {
  try {
    await fn();
  } catch (err) {
    console.error(`❌ [CRON] Fallo en ${name}:`, err.message);
  }
};

const initCronJobs = () => {
  // --- 📦 CRONS DE INVENTARIO ---
  // Ejecuta la lógica delegada en su propio archivo (Alertas Telegram)
  startInventoryCron();

  // --- ⏰ CRONS DE MARKETING Y CITAS ---
  // RELOJ DIARIO: Se ejecuta todos los días a las 08:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("🌅 [CRON] Iniciando tareas diarias de marketing (8:00 AM)...");
    await runTask("sendReferralInvitations", sendReferralInvitations);
    await runTask("sendTouchUpReminders", sendTouchUpReminders);
    await runTask("sendFollowUpReminders", sendFollowUpReminders);
    await runTask("sendPostOperativeCare", sendPostOperativeCare);
    await runTask("processScheduledCoupons", processScheduledCoupons);
    await runTask("sendBirthdayCoupons", sendBirthdayCoupons);
    await runTask("sendMaintenanceCoupons", sendMaintenanceCoupons);
    await runTask("sendDailyReminders", sendDailyReminders);
  });

  // RELOJ RÁPIDO: Se ejecuta cada 15 minutos
  cron.schedule("*/15 * * * *", async () => {
    console.log("⚡ [CRON] Revisando waitlist...");
    await runTask("expireWaitlistNotifications", expireWaitlistNotifications);
  });
};

export default initCronJobs;
