import express from "express";
import { login } from "../controllers/authController.js";
import {
  registerUser,
  getUsers,
  getProfile,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

// Middlewares
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import { validateSchema } from "../middlewares/validateSchema.js"; 

// Esquemas de Zod (Asegúrate de que los nombres coincidan en userValidator.js)
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
} from "../validators/userValidator.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post("/login", validateSchema({ body: loginSchema }), login);

// --- PROTECTED ROUTES ---
router.get("/profile", checkAuth, getProfile);

// --- ADMIN ONLY ROUTES ---
router
  .route("/")
  .post(
    checkAuth,
    authorizeRole("ADMIN"),
    validateSchema({ body: createUserSchema }), // Zod maneja el .strict() internamente
    registerUser,
  )
  .get(checkAuth, authorizeRole("ADMIN"), getUsers);

router
  .route("/:id")
  .get(checkAuth, authorizeRole("ADMIN"), validateObjectId, getUserById)
  .put(
    checkAuth,
    authorizeRole("ADMIN"),
    validateObjectId,
    validateSchema({ body: updateUserSchema }), // Consistencia total con el resto del sistema
    updateUser,
  )
  .delete(checkAuth, authorizeRole("ADMIN"), validateObjectId, deleteUser);

export default router;
