import Appointment from "../models/Appointment.js";
import StaffEarning from "../models/finance/StaffEarning.js";
import User from "../models/User.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import {
  computeCommission,
  getCollaboratorStatement,
  getAdminSummary,
} from "../services/financeService.js";
import {
  statementQuerySchema,
  summaryQuerySchema,
} from "../validators/financeValidator.js";

/**
 * @desc    Estado de cuenta de un colaborador para un mes (citas + ganancias + resumen)
 * @route   GET /api/finance/my-statement
 * @access  Private (ADMIN ve cualquiera; colaborador solo el suyo)
 */
const getMyStatement = asyncHandler(async (req, res, next) => {
  const { month, year, collaboratorId } = statementQuerySchema.parse(req.query);

  // Un colaborador solo puede ver lo suyo; el admin puede pasar collaboratorId.
  const targetId =
    req.user.role === "ADMIN"
      ? collaboratorId || req.user._id
      : req.user._id;

  const statement = await getCollaboratorStatement(targetId, month, year);
  sendResponse(res, 200, { ...statement, month, year });
});

/**
 * @desc    Resumen del mes por colaborador (panel admin)
 * @route   GET /api/finance/admin-summary
 * @access  Private (ADMIN)
 */
const getAdminFinanceSummary = asyncHandler(async (req, res, next) => {
  const { month, year } = summaryQuerySchema.parse(req.query);
  const collaborators = await getAdminSummary(month, year);
  sendResponse(res, 200, { collaborators, month, year });
});

/**
 * @desc    Registrar / confirmar la ganancia de una cita completada
 * @route   POST /api/finance/earnings
 * @access  Private (ADMIN o el colaborador dueño de la cita)
 */
const recordEarning = asyncHandler(async (req, res, next) => {
  const {
    appointmentId,
    earnedAmount,
    commissionValue: bodyCommissionValue,
    commissionType: bodyCommissionType,
  } = req.body;

  const appointment = await Appointment.findById(appointmentId)
    .populate("patientId", "name")
    .lean();

  if (!appointment) return next(new AppError("La cita no existe", 404));

  if (appointment.status !== "COMPLETED") {
    return next(
      new AppError("Solo se pueden registrar ganancias de citas completadas", 400),
    );
  }

  // Control de propiedad: el colaborador solo registra sus propias citas.
  const isOwner = String(appointment.doctorId) === String(req.user._id);
  if (req.user.role !== "ADMIN" && !isOwner) {
    return next(new AppError("No puedes registrar ganancias de otro colaborador", 403));
  }

  // Config de comisión del colaborador que atendió la cita.
  const collaborator = await User.findById(appointment.doctorId).select(
    "commissionType commissionValue",
  );
  if (!collaborator) return next(new AppError("Colaborador no encontrado", 404));

  const commissionType = bodyCommissionType ?? collaborator.commissionType ?? "PERCENTAGE";
  const commissionValue =
    bodyCommissionValue !== undefined
      ? Number(bodyCommissionValue)
      : collaborator.commissionValue || 0;
  const commissionAmount = computeCommission(earnedAmount, commissionType, commissionValue);

  // Upsert por cita (un solo registro por appointmentId).
  const earning = await StaffEarning.findOneAndUpdate(
    { appointmentId },
    {
      collaboratorId: appointment.doctorId,
      appointmentId,
      patientId: appointment.patientId?._id,
      patientName: appointment.patientId?.name,
      treatmentName: appointment.treatmentName,
      earnedAmount,
      commissionType,
      commissionValue,
      commissionAmount,
      serviceDate: appointment.appointmentDate,
      createdBy: req.user._id,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  sendResponse(res, 201, earning, "Ganancia registrada correctamente");
});

/**
 * @desc    Ajustar el monto ganado de un registro existente (recalcula comisión)
 * @route   PUT /api/finance/earnings/:id
 * @access  Private (ADMIN o el colaborador dueño)
 */
const updateEarning = asyncHandler(async (req, res, next) => {
  const {
    earnedAmount,
    commissionValue: bodyCommissionValue,
    commissionType: bodyCommissionType,
  } = req.body;

  const earning = await StaffEarning.findById(req.params.id);
  if (!earning) return next(new AppError("Registro de ganancia no encontrado", 404));

  const isOwner = String(earning.collaboratorId) === String(req.user._id);
  if (req.user.role !== "ADMIN" && !isOwner) {
    return next(new AppError("No puedes modificar ganancias de otro colaborador", 403));
  }

  earning.earnedAmount = earnedAmount;
  if (bodyCommissionValue !== undefined) earning.commissionValue = Number(bodyCommissionValue);
  if (bodyCommissionType) earning.commissionType = bodyCommissionType;
  earning.commissionAmount = computeCommission(
    earning.earnedAmount,
    earning.commissionType,
    earning.commissionValue,
  );
  await earning.save();

  sendResponse(res, 200, earning, "Ganancia actualizada correctamente");
});

export { getMyStatement, getAdminFinanceSummary, recordEarning, updateEarning };
