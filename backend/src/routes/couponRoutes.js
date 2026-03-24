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
  .get(authorizeRole("ADMIN", "RECEPTIONIST"), getCoupons)
  .post(authorizeRole("ADMIN"), validateCreateCoupon, createCoupon);

router.get("/stats", authorizeRole("ADMIN", "RECEPTIONIST"), getCouponStats);
router.post("/validate", validateCouponCode);

/**
 * 🔐 RUTAS PARAMETRIZADAS
 */
router
  .route("/:id")
  .all(validateObjectId)
  .get(authorizeRole("ADMIN", "RECEPTIONIST"), getCouponById)
  .put(authorizeRole("ADMIN"), validateUpdateCoupon, updateCoupon)
  .delete(authorizeRole("ADMIN"), deleteCoupon);

router.patch(
  "/:id/deactivate",
  validateObjectId,
  authorizeRole("ADMIN"),
  deactivateCoupon,
);

router.post(
  "/:id/send-now",
  validateObjectId,
  authorizeRole("ADMIN"),
  sendCouponNow,
);

export default router;
