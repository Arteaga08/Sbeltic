import PatientDeuda from "../models/clinical/PatientDeuda.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

export const getDeudas = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const deudas = await PatientDeuda.find({ patientId })
    .populate("payments.createdBy", "name")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, deudas);
});

export const createDeuda = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;
  const { concept, totalAmount } = req.body;
  if (!concept || totalAmount == null) {
    return next(new AppError("concept y totalAmount son requeridos", 400));
  }
  const deuda = await PatientDeuda.create({
    patientId,
    concept: concept.trim(),
    totalAmount: Number(totalAmount),
    createdBy: req.user._id,
  });
  sendResponse(res, 201, deuda, "Deuda registrada");
});

export const addPayment = asyncHandler(async (req, res, next) => {
  const { patientId, deudaId } = req.params;
  const { amount, note } = req.body;
  if (!amount || Number(amount) <= 0) {
    return next(new AppError("amount debe ser mayor a 0", 400));
  }
  const deuda = await PatientDeuda.findOne({ _id: deudaId, patientId });
  if (!deuda) return next(new AppError("Deuda no encontrada", 404));

  deuda.payments.push({
    amount: Number(amount),
    note: note?.trim() || "",
    createdBy: req.user._id,
  });
  await deuda.save();

  await deuda.populate("payments.createdBy", "name");
  await deuda.populate("createdBy", "name");
  sendResponse(res, 200, deuda, "Abono registrado");
});

export const deleteDeuda = asyncHandler(async (req, res, next) => {
  const { patientId, deudaId } = req.params;
  const deuda = await PatientDeuda.findOneAndDelete({ _id: deudaId, patientId });
  if (!deuda) return next(new AppError("Deuda no encontrada", 404));
  sendResponse(res, 200, null, "Deuda eliminada");
});
