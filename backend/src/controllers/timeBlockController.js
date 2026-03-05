import TimeBlock from "../models/TimeBlock.js";
import Appointment from "../models/Appointment.js"; // Importación vital
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

const addTimeBlock = asyncHandler(async (req, res, next) => {
  const { doctorId, startTime, endTime } = req.body;
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  // 1. 🔥 CRÍTICO: Verificar colisión con CITAS existentes
  // Usamos los campos correctos del modelo Appointment (appointmentDate y endDate)
  const appointmentCollision = await Appointment.findOne({
    doctorId,
    status: { $in: ["CONFIRMED", "PENDING", "IN_PROGRESS"] },
    appointmentDate: { $lt: newEnd },
    endDate: { $gt: newStart },
  });

  if (appointmentCollision) {
    return next(
      new AppError(
        "Cannot block this time: An active appointment already exists in this slot.",
        400,
      ),
    );
  }

  // 2. Verificar colisión con otros BLOQUEOS
  const existingBlock = await TimeBlock.findOne({
    doctorId,
    isActive: true,
    startTime: { $lt: newEnd },
    endTime: { $gt: newStart },
  });

  if (existingBlock) {
    return next(
      new AppError(
        `Existing ${existingBlock.type} block detected at this time`,
        400,
      ),
    );
  }

  const timeBlock = new TimeBlock({
    ...req.body,
    createdBy: req.user._id,
  });

  await timeBlock.save();
  sendResponse(res, 201, timeBlock, "Time block created successfully");
});

const getTimeBlocks = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;
  const query = { isActive: true };

  if (doctorId) query.doctorId = doctorId;

  if (date) {
    // 3. ✅ Versión segura sin mutación de objetos
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query.startTime = { $gte: startOfDay, $lte: endOfDay };
  }

  const blocks = await TimeBlock.find(query)
    .populate("doctorId", "name")
    .sort({ startTime: 1 });

  sendResponse(res, 200, blocks);
});

const deleteTimeBlock = asyncHandler(async (req, res, next) => {
  // 4. ✅ Soft Delete para trazabilidad legal
  const block = await TimeBlock.findById(req.params.id);

  if (!block) return next(new AppError("Time block not found", 404));

  block.isActive = false;
  await block.save();

  sendResponse(res, 200, null, "Time block deactivated successfully");
});

export { addTimeBlock, getTimeBlocks, deleteTimeBlock };
