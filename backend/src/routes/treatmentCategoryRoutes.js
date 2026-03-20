import express from "express";
import {
  getTreatmentCategories,
  createTreatmentCategory,
  updateTreatmentCategory,
  deleteTreatmentCategory,
} from "../controllers/treatmentCategoryController.js";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import {
  validateCreateTreatmentCategory,
  validateUpdateTreatmentCategory,
} from "../validators/treatmentCategoryValidator.js";

const router = express.Router();

router
  .route("/")
  .get(checkAuth, getTreatmentCategories)
  .post(checkAuth, authorizeRole("ADMIN"), validateCreateTreatmentCategory, createTreatmentCategory);

router
  .route("/:id")
  .put(checkAuth, authorizeRole("ADMIN"), validateObjectId, validateUpdateTreatmentCategory, updateTreatmentCategory)
  .delete(checkAuth, authorizeRole("ADMIN"), validateObjectId, deleteTreatmentCategory);

export default router;
