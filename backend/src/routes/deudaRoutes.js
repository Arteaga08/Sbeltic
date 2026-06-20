import express from "express";
import {
  getDeudas,
  createDeuda,
  addPayment,
  applyCouponToDeuda,
  deleteDeuda,
} from "../controllers/deudaController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";

const router = express.Router({ mergeParams: true });

router.use(checkAuth);

router
  .route("/")
  .get(authorizeRole("ADMIN", "RECEPTIONIST", "DOCTOR"), getDeudas)
  .post(authorizeRole("ADMIN", "RECEPTIONIST"), createDeuda);

router.post(
  "/:deudaId/payments",
  authorizeRole("ADMIN", "RECEPTIONIST"),
  addPayment,
);

router.post(
  "/:deudaId/apply-coupon",
  authorizeRole("ADMIN", "RECEPTIONIST"),
  applyCouponToDeuda,
);

router.delete(
  "/:deudaId",
  authorizeRole("ADMIN"),
  deleteDeuda,
);

export default router;
