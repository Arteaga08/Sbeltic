import express from "express";
import {
  createCoupon,
  getCoupons,
  deactivateCoupon,
  validateCouponCode,
  getCouponStats,
} from "../controllers/couponController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateCreateCoupon } from "../validators/couponValidator.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

/**
 * 🔐 RUTAS ADMINISTRATIVAS
 */
router
  .route("/")
  .get(authorizeRole("ADMIN", "RECEPTIONIST"), getCoupons)
  .post(authorizeRole("ADMIN"), validateCreateCoupon, createCoupon);

router.get("/stats", authorizeRole("ADMIN", "RECEPTIONIST"), getCouponStats);

router.route("/:id/deactivate").patch(authorizeRole("ADMIN"), deactivateCoupon);

/**
 * 🏷️ RUTA DE VALIDACIÓN (Motor de Marketing)
 * Cambiamos a POST para poder enviar { code, patientId }
 */
router.post("/validate", validateCouponCode);

export default router;
