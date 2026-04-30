import express from "express";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js";

import { paramsIdSchema } from "../validators/common.js";
import {
  createPostOpNoteTemplateSchema,
  updatePostOpNoteTemplateSchema,
  createPrescriptionTemplateSchema,
  updatePrescriptionTemplateSchema,
} from "../validators/templateValidator.js";
import {
  listPostOpNoteTemplates,
  createPostOpNoteTemplate,
  updatePostOpNoteTemplate,
  deletePostOpNoteTemplate,
  listPrescriptionTemplates,
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  deletePrescriptionTemplate,
} from "../controllers/templateController.js";

const router = express.Router();

// Solo DOCTOR y ADMIN pueden gestionar plantillas
router.use(checkAuth);
router.use(authorizeRole("DOCTOR", "ADMIN"));

// 📝 Plantillas de notas post-operatorias
router
  .route("/post-op-notes")
  .get(listPostOpNoteTemplates)
  .post(
    validateSchema({ body: createPostOpNoteTemplateSchema }),
    createPostOpNoteTemplate,
  );

router
  .route("/post-op-notes/:id")
  .all(validateSchema({ params: paramsIdSchema }))
  .put(
    validateSchema({ body: updatePostOpNoteTemplateSchema }),
    updatePostOpNoteTemplate,
  )
  .delete(deletePostOpNoteTemplate);

// 💊 Plantillas de recetas médicas
router
  .route("/prescriptions")
  .get(listPrescriptionTemplates)
  .post(
    validateSchema({ body: createPrescriptionTemplateSchema }),
    createPrescriptionTemplate,
  );

router
  .route("/prescriptions/:id")
  .all(validateSchema({ params: paramsIdSchema }))
  .put(
    validateSchema({ body: updatePrescriptionTemplateSchema }),
    updatePrescriptionTemplate,
  )
  .delete(deletePrescriptionTemplate);

export default router;
