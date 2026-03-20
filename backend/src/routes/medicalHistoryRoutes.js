import express from "express";
import {
  validateMedicalHistoryToken,
  submitMedicalHistory,
} from "../controllers/medicalHistoryController.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { medicalHistorySubmitSchema } from "../validators/publicValidator.js";

const router = express.Router();

router.get("/validate/:token", validateMedicalHistoryToken);

router.post(
  "/submit/:token",
  validateSchema({ body: medicalHistorySubmitSchema }),
  submitMedicalHistory,
);

export default router;
