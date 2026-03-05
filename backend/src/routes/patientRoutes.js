import express from "express";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js";

import { paramsIdSchema } from "../validators/common.js";
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
} from "../controllers/patientController.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validators/patientValidator.js";

const router = express.Router();
console.log("🔍 DEBUG - createPatient es:", typeof createPatient);
console.log("🔍 DEBUG - validateSchema es:", typeof validateSchema);

// Todos los roles del staff pueden ver/crear pacientes
router.use(checkAuth);
router.use(authorizeRole("ADMIN", "RECEPTIONIST", "DOCTOR"));

router
  .route("/")
  .post(validateSchema({ body: createPatientSchema }), createPatient)
  .get(getPatients);

router
  .route("/:id")
  .all(validateSchema({ params: paramsIdSchema }))
  .get(getPatientById)
  .put(validateSchema({ body: updatePatientSchema }), updatePatient)
  .delete(authorizeRole("ADMIN"), deletePatient); // Solo Admin puede desactivar

export default router;
