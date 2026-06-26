import express from "express";
import {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  markRecipientSent,
  deleteBroadcast,
} from "../controllers/broadcastController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import { validateCreateBroadcast } from "../validators/broadcastValidator.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

router
  .route("/")
  .get(authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"), getBroadcasts)
  .post(
    authorizeRole("ADMIN", "MARKETING"),
    validateCreateBroadcast,
    createBroadcast,
  );

// Marcar un destinatario como enviado
router.patch(
  "/:id/recipients/:patientId",
  validateObjectId,
  authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"),
  markRecipientSent,
);

router
  .route("/:id")
  .all(validateObjectId)
  .get(authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"), getBroadcastById)
  .delete(authorizeRole("ADMIN", "MARKETING"), deleteBroadcast);

export default router;
