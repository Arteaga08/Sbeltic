import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

// Middlewares
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import { validateSchema } from "../middlewares/validateSchema.js";

// Validadores Zod
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/categoryValidator.js";

const router = express.Router();

// --- RUTAS DE CATEGORÍAS ---
router
  .route("/")
  .post(
    checkAuth,
    authorizeRole("ADMIN"), // Solo Admin crea categorías
    validateSchema({ body: createCategorySchema }),
    createCategory,
  )
  .get(checkAuth, getCategories); // Cualquier usuario logueado puede verlas (para los dropdowns)

router
  .route("/:id")
  .get(checkAuth, validateObjectId, getCategoryById)
  .put(
    checkAuth,
    authorizeRole("ADMIN"),
    validateObjectId,
    validateSchema({ body: updateCategorySchema }),
    updateCategory,
  )
  .delete(checkAuth, authorizeRole("ADMIN"), validateObjectId, deleteCategory);

export default router;
