import cron from "node-cron";
import {
  getLowStockProducts,
  getExpiringBatches,
} from "../services/inventoryAlertService.js";
import { sendTelegramAlert } from "../services/notificationService.js";

// Configuración: Se ejecuta todos los días a las 08:00 AM
const startInventoryCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("[Cron]: Iniciando revisión diaria de inventario...");

    try {
      const lowStock = await getLowStockProducts();
      const expiring = await getExpiringBatches(30); // Lotes a 30 días de caducar

      if (lowStock.length === 0 && expiring.length === 0) return;

      // Construcción del reporte para el Admin
      let message = "📊 *REPORTE DIARIO DE INVENTARIO - SBELTIC*\n\n";

      if (lowStock.length > 0) {
        message += "⚠️ *STOCK CRÍTICO:*\n";
        lowStock.forEach((p) => {
          message += `• ${p.name} (${p.currentStock} ${p.unit} restantes)\n`;
        });
        message += "\n";
      }

      if (expiring.length > 0) {
        message += "*PRÓXIMOS A CADUCAR (30 días):*\n";
        expiring.forEach((b) => {
          const date = new Date(b.expiryDate).toLocaleDateString();
          message += `• ${b.productId.name} - Lote: ${b.batchNumber} (Vence: ${date})\n`;
        });
      }

      // Enviamos al Bot del Admin (ID configurado en .env)
      await sendTelegramAlert(message, process.env.TELEGRAM_ADMIN_CHAT_ID);
    } catch (error) {
      console.error("[Cron Error]: Fallo en la revisión de inventario:", error);
    }
  });
};

export { startInventoryCron };
