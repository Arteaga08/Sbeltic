import express from "express";
import {
  createCoupon,
  createManualCoupon,
  createReferralCoupon,
  getPatientReferrals,
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
  validateCreateManualCoupon,
  validateCreateReferralCoupon,
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

// 🏷️ Cupón manual creado y asignado desde el expediente clínico
router.post(
  "/manual",
  authorizeRole("ADMIN", "RECEPTIONIST"),
  validateCreateManualCoupon,
  createManualCoupon,
);

// 🤝 Cupón de referido global y compartible (a nombre de un paciente dueño)
router.post(
  "/referral",
  authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING"),
  validateCreateReferralCoupon,
  createReferralCoupon,
);

// 📋 Referidos de un paciente dueño (para reflejarlos en su expediente)
router.get(
  "/referrals/:ownerId",
  authorizeRole("ADMIN", "RECEPTIONIST", "MARKETING", "DOCTOR"),
  getPatientReferrals,
);

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
