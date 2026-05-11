import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
  checkAvailability,
  adjustStock,
} from "../controllers/productController.js";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

router.use(checkAuth);

router
  .route("/")
  .get(getProducts)
  .post(
    authorizeRole("ADMIN", "RECEPTIONIST", "NURSE"),
    validateSchema({ body: createProductSchema }),
    createProduct,
  );

// Verificar disponibilidad de stock (pre-checkout)
router.post("/check-availability", checkAvailability);

// Buscar producto por SKU (para QR scan) — debe ir ANTES de /:id
router.get("/sku/:sku", getProductBySku);

router
  .route("/:id")
  .get(validateObjectId, getProductById)
  .put(
    authorizeRole("ADMIN", "RECEPTIONIST", "NURSE"),
    validateObjectId,
    validateSchema({ body: updateProductSchema }),
    updateProduct,
  )
  .delete(
    authorizeRole("ADMIN", "RECEPTIONIST", "NURSE"),
    validateObjectId,
    deleteProduct, // Soft Delete (isActive: false)
  );

// Ajuste manual de stock (entrada o salida)
router.post(
  "/:id/adjust-stock",
  authorizeRole("ADMIN", "RECEPTIONIST", "NURSE"),
  validateObjectId,
  adjustStock,
);

export default router;
