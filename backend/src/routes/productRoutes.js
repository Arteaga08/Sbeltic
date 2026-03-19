import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  checkAvailability,
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
    authorizeRole("ADMIN"),
    validateSchema({ body: createProductSchema }),
    createProduct,
  );

// Verificar disponibilidad de stock (pre-checkout)
router.post("/check-availability", checkAvailability);

router
  .route("/:id")
  .get(validateObjectId, getProductById)
  .put(
    authorizeRole("ADMIN"),
    validateObjectId,
    validateSchema({ body: updateProductSchema }),
    updateProduct,
  )
  .delete(
    authorizeRole("ADMIN"),
    validateObjectId,
    deleteProduct, // Soft Delete (isActive: false)
  );

export default router;
