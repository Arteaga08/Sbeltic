import express from "express";
import { getSignInfo, saveSignature } from "../controllers/publicController.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { publicSignatureSchema } from "../validators/publicValidator.js";

const router = express.Router();

router.get("/info/:id", getSignInfo);

// 🛡️ Usamos validateSchema y le pasamos el esquema en la propiedad body
router.post(
  "/sign/:id",
  validateSchema({ body: publicSignatureSchema }),
  saveSignature,
);

export default router;
