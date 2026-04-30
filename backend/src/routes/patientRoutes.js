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
  addEvolution,
  addPostOpNote,
  addPrescription,
  requestSignatureToken,
  generateMedicalHistoryToken,
} from "../controllers/patientController.js";
import {
  createPatientSchema,
  updatePatientSchema,
  createEvolutionSchema,
  createPostOpNoteSchema,
  createPrescriptionSchema,
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

router.post(
  "/:id/evolutions",
  authorizeRole("DOCTOR", "ADMIN"),
  validateSchema({ body: createEvolutionSchema }),
  addEvolution,
);

// 📝 Notas post-operatorias
router.post(
  "/:id/post-op-notes",
  authorizeRole("DOCTOR", "ADMIN"),
  validateSchema({ params: paramsIdSchema, body: createPostOpNoteSchema }),
  addPostOpNote,
);

// 💊 Recetas médicas
router.post(
  "/:id/prescriptions",
  authorizeRole("DOCTOR", "ADMIN"),
  validateSchema({ params: paramsIdSchema, body: createPrescriptionSchema }),
  addPrescription,
);

// Generar token temporal para link de firma (botón WhatsApp del frontend)
router.post("/:id/signature-token", requestSignatureToken);

// Generar enlace de formulario de historial médico (solo SURGERY y LEAD)
router.post("/:id/medical-history-token", generateMedicalHistoryToken);

export default router;
