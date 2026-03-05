import express from "express";
import {
  addTimeBlock,
  getTimeBlocks,
  deleteTimeBlock,
} from "../controllers/timeBlockController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { createTimeBlockSchema } from "../validators/timeBlockValidator.js";
import { paramsIdSchema } from "../validators/common.js";

const router = express.Router();

router.use(checkAuth);

router
  .route("/")
  .post(
    authorizeRole("ADMIN", "RECEPTIONIST", "DOCTOR"),
    validateSchema({ body: createTimeBlockSchema }),
    addTimeBlock,
  )
  .get(getTimeBlocks);

router
  .route("/:id")
  .delete(
    authorizeRole("ADMIN", "RECEPTIONIST", "DOCTOR"),
    validateSchema({ params: paramsIdSchema }),
    deleteTimeBlock,
  );

export default router;
