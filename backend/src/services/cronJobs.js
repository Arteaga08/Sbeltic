import cron from "node-cron";
import {
  sendReferralInvitations,
  sendTouchUpReminders,
  sendHourlyReminders, // 🔥 El nuevo servicio rápido
} from "../services/automationService.js";

const initCronJobs = () => {
  // ⏰ RELOJ DIARIO: Se ejecuta todos los días a las 08:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("🌅 [CRON] Iniciando tareas diarias de marketing (8:00 AM)...");
    await sendReferralInvitations();
    await sendTouchUpReminders();
  });

  // ⏱️ RELOJ RÁPIDO: Se ejecuta cada 15 minutos (ej. 10:00, 10:15, 10:30)
  cron.schedule("*/15 * * * *", async () => {
    console.log("⚡ [CRON] Revisando citas próximas (1 hora antes)...");
    await sendHourlyReminders();
  });
};

export default initCronJobs;
