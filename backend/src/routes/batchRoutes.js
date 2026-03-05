import express from "express";
import {
  createBatch,
  getBatches,
  updateBatch,
} from "../controllers/batchController.js";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import {
  validateCreateBatch,
  validateUpdateBatch,
} from "../validators/batchValidator.js";

const router = express.Router();

router.use(checkAuth);

router
  .route("/")
  .get(getBatches) // Ver qué lotes tenemos y cuándo caducan
  .post(authorizeRole("ADMIN"), validateCreateBatch, createBatch); // Registrar entrada

router
  .route("/:id")
  .put(
    authorizeRole("ADMIN"),
    validateObjectId,
    validateUpdateBatch,
    updateBatch,
  );

export default router;
