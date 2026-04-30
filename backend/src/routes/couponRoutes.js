import express from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
  validateCouponCode,
  getCouponStats,
  deleteCoupon,
  sendCouponNow,
} from "../controllers/couponController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import {
  validateCreateCoupon,
  validateUpdateCoupon,
} from "../validators/couponValidator.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

/**
 * 🔐 RUTAS LITERALES (antes de las parametrizadas)
 */
router
  .route("/")
  .get(authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"), getCoupons)
  .post(authorizeRole("ADMIN", "MARKETING"), validateCreateCoupon, createCoupon);

router.get("/stats", authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"), getCouponStats);
router.post("/validate", validateCouponCode);

/**
 * 🔐 RUTAS PARAMETRIZADAS
 */
router
  .route("/:id")
  .all(validateObjectId)
  .get(authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"), getCouponById)
  .put(authorizeRole("ADMIN", "MARKETING"), validateUpdateCoupon, updateCoupon)
  .delete(authorizeRole("ADMIN", "MARKETING"), deleteCoupon);

router.patch(
  "/:id/deactivate",
  validateObjectId,
  authorizeRole("ADMIN", "MARKETING"),
  deactivateCoupon,
);

router.post(
  "/:id/send-now",
  validateObjectId,
  authorizeRole("ADMIN", "MARKETING"),
  sendCouponNow,
);

export default router;
