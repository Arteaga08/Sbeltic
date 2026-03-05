import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import checkAuth from "../middlewares/checkAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validators/appointmentValidator.js";
import { paramsIdSchema } from "../validators/common.js";

const router = express.Router();
const staff = ["ADMIN", "RECEPTIONIST", "DOCTOR"];

router.use(checkAuth);

router
  .route("/")
  .get(getAppointments)
  .post(
    authorizeRole(...staff),
    validateSchema({ body: createAppointmentSchema }),
    createAppointment,
  );

router
  .route("/:id")
  .all(validateSchema({ params: paramsIdSchema }))
  .get(getAppointmentById)
  .put(
    authorizeRole(...staff),
    validateSchema({ body: updateAppointmentSchema }),
    updateAppointment,
  );

router.patch(
  "/:id/cancel",
  authorizeRole(...staff),
  validateSchema({ params: paramsIdSchema }),
  cancelAppointment,
);

export default router;
