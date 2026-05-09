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
  uploadPatientPhoto,
  deletePatientPhoto,
  streamPatientPhoto,
} from "../controllers/patientController.js";
import {
  createPatientSchema,
  updatePatientSchema,
  createEvolutionSchema,
  createPostOpNoteSchema,
  createPrescriptionSchema,
  uploadPhotoBodySchema,
  photoFilenameSchema,
  photoIdParamsSchema,
} from "../validators/patientValidator.js";
import uploadPhoto from "../middlewares/uploadPhoto.js";

const router = express.Router();
console.log("🔍 DEBUG - createPatient es:", typeof createPatient);
console.log("🔍 DEBUG - validateSchema es:", typeof validateSchema);

// Todos los roles del staff pueden ver/crear pacientes
router.use(checkAuth);
router.use(authorizeRole("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PHYSIOTHERAPIST"));

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

// 📸 Fotos antes/después — SOLO ADMIN puede subir, ver archivos y eliminar
router.post(
  "/:id/photos",
  authorizeRole("ADMIN"),
  uploadPhoto,
  validateSchema({ params: paramsIdSchema, body: uploadPhotoBodySchema }),
  uploadPatientPhoto,
);

router.delete(
  "/:id/photos/:photoId",
  authorizeRole("ADMIN"),
  validateSchema({ params: photoIdParamsSchema }),
  deletePatientPhoto,
);

router.get(
  "/:id/photos/file/:filename",
  authorizeRole("ADMIN"),
  validateSchema({ params: photoFilenameSchema }),
  streamPatientPhoto,
);

// Generar token temporal para link de firma (botón WhatsApp del frontend)
router.post("/:id/signature-token", requestSignatureToken);

// Generar enlace de formulario de historial médico (solo SURGERY y LEAD)
router.post("/:id/medical-history-token", generateMedicalHistoryToken);

export default router;
