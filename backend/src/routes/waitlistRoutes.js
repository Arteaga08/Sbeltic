import express from "express";
import {
  addToWaitlist,
  getWaitlist,
  updateWaitlistStatus,
} from "../controllers/waitlistController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js"; // Ajusta la ruta a tu middleware
import {
  createWaitlistSchema,
  updateWaitlistSchema,
} from "../validators/waitlistValidator.js";

const router = express.Router();

router.use(checkAuth);
router.use(authorizeRole("ADMIN", "RECEPTIONIST"));

router
  .route("/")
  .post(validateSchema(createWaitlistSchema), addToWaitlist)
  .get(getWaitlist);

router
  .route("/:id")
  .put(validateSchema(updateWaitlistSchema), updateWaitlistStatus);

export default router;
