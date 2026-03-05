import express from "express";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
// 🛡️ IMPORTANTE: Necesitas este middleware para procesar los esquemas
import { validateSchema } from "../middlewares/validateSchema.js";

import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../validators/supplierValidator.js";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierById,
} from "../controllers/supplierController.js";

const router = express.Router();

router.use(checkAuth);

router
  .route("/")
  .get(getSuppliers)
  .post(
    authorizeRole("ADMIN"),
    validateSchema({ body: createSupplierSchema }), // 👈 Envolver aquí
    createSupplier,
  );

router
  .route("/:id")
  .get(validateObjectId, getSupplierById)
  .put(
    authorizeRole("ADMIN"),
    validateObjectId,
    validateSchema({ body: updateSupplierSchema }), // 👈 Envolver aquí
    updateSupplier,
  );

export default router;
