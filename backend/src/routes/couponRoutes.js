import express from "express";
import {
  createCoupon,
  getCoupons,
  deactivateCoupon,
  validateCouponCode,
} from "../controllers/couponController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateCreateCoupon } from "../validators/couponValidator.js";

const router = express.Router();

// Todas las rutas de cupones requieren estar logueado
router.use(checkAuth);

/**
 * RUTAS ADMINISTRATIVAS
 */
router
  .route("/")
  .get(getCoupons) // Ver todos los cupones (con filtros ?status=active)
  .post(authorizeRole("ADMIN"), validateCreateCoupon, createCoupon); // Crear cupones

router.route("/:id/deactivate").patch(authorizeRole("ADMIN"), deactivateCoupon); // Desactivar cupón sin borrarlo

/**
 * RUTA PÚBLICA (Para el Bot o la Recepcionista)
 */
router.get("/validate/:code", validateCouponCode);

export default router;
