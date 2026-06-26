import express from "express";
import {
  getMyStatement,
  getAdminFinanceSummary,
  recordEarning,
  updateEarning,
} from "../controllers/financeController.js";

import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import { validateSchema } from "../middlewares/validateSchema.js";

import {
  recordEarningSchema,
  updateEarningSchema,
} from "../validators/financeValidator.js";

const router = express.Router();

router.use(checkAuth);

// Roles colaboradores + admin pueden consultar/registrar su propio estado.
const FINANCE_ROLES = ["ADMIN", "DOCTOR", "PHYSIOTHERAPIST"];

router.get("/my-statement", authorizeRole(...FINANCE_ROLES), getMyStatement);

router.get("/admin-summary", authorizeRole("ADMIN"), getAdminFinanceSummary);

router.post(
  "/earnings",
  authorizeRole(...FINANCE_ROLES),
  validateSchema({ body: recordEarningSchema }),
  recordEarning,
);

router.put(
  "/earnings/:id",
  authorizeRole(...FINANCE_ROLES),
  validateObjectId,
  validateSchema({ body: updateEarningSchema }),
  updateEarning,
);

export default router;
