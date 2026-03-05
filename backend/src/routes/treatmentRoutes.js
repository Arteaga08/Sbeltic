import express from "express";
import {
  getTreatments,
  createTreatment,
  updateTreatment,
} from "../controllers/treatmentController.js";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";

import {
  validateCreateTreatment,
  validateUpdateTreatment,
} from "../validators/treatmentValidator.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

router.route("/").get(checkAuth, getTreatments).post(
  checkAuth,
  authorizeRole("ADMIN", "DOCTOR"),
  validateCreateTreatment,
  createTreatment,
);

router.route("/:id").put(
  checkAuth,
  authorizeRole("ADMIN", "DOCTOR"),
  validateObjectId, // Protege la URL
  validateUpdateTreatment, 
  updateTreatment,
);

export default router;
