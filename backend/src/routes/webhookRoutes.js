import express from "express";
import {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

// Meta envía GET para verificar el webhook
router.get("/whatsapp", verifyWhatsAppWebhook);

// Meta envía POST con mensajes entrantes
router.post("/whatsapp", handleWhatsAppWebhook);

export default router;
