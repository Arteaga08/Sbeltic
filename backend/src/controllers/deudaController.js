import mongoose from "mongoose";
import PatientDeuda from "../models/clinical/PatientDeuda.js";
import Coupon from "../models/marketing/Coupon.js";
import Patient from "../models/clinical/Patient.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { transactionsSupported } from "../config/db.js";

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

/**
 * Aplica un cupón de monto fijo (FIXED_AMOUNT) de la cartera del paciente como
 * abono a una deuda. El cupón se consume por completo; si su valor supera el
 * saldo, solo se abona el saldo restante. Operación atómica (transacción).
 */
export const applyCouponToDeuda = asyncHandler(async (req, res, next) => {
  const { patientId, deudaId } = req.params;
  const { couponId } = req.body;

  if (!couponId) return next(new AppError("couponId es requerido", 400));

  // Lógica del abono. Recibe una `session` opcional (null en standalone).
  const run = async (session) => {
    const patient = await Patient.findById(patientId).session(session);
    if (!patient) throw new AppError("Paciente no encontrado", 404);

    const ownsCoupon = (patient.walletCoupons || []).some(
      (c) => c.toString() === couponId,
    );
    if (!ownsCoupon) {
      throw new AppError("El cupón no pertenece a la cartera del paciente", 400);
    }

    const coupon = await Coupon.findById(couponId).session(session);
    if (!coupon) throw new AppError("Cupón no encontrado", 404);

    if (coupon.discountType !== "FIXED_AMOUNT") {
      throw new AppError("Solo los cupones de monto fijo pueden abonar a deuda", 400);
    }
    if (!coupon.isActive) throw new AppError("El cupón no está activo", 400);
    if (new Date(coupon.expiresAt) < new Date()) {
      throw new AppError("El cupón está vencido", 400);
    }
    if (coupon.usedCount >= coupon.maxRedemptions) {
      throw new AppError("El cupón ya se ha agotado", 400);
    }

    const deuda = await PatientDeuda.findOne({ _id: deudaId, patientId }).session(session);
    if (!deuda) throw new AppError("Deuda no encontrada", 404);
    if (deuda.balance <= 0) throw new AppError("Esta deuda ya está saldada", 400);

    const amount = Math.min(coupon.discountValue, deuda.balance);
    deuda.payments.push({
      amount,
      method: "COUPON",
      couponId: coupon._id,
      note: `Abono con cupón ${coupon.code}`,
      createdBy: req.user._id,
    });
    await deuda.save({ session });

    coupon.usedCount += 1;
    coupon.usedBy.push({ patientId, usedAt: new Date() });
    if (coupon.usedCount >= coupon.maxRedemptions) coupon.isActive = false;
    await coupon.save({ session });

    await deuda.populate("payments.createdBy", "name");
    await deuda.populate("createdBy", "name");
    return deuda;
  };

  let result;
  if (transactionsSupported()) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        result = await run(session);
      });
    } finally {
      session.endSession();
    }
  } else {
    // Standalone: sin transacción (no atómico, pero funcional).
    result = await run(null);
  }

  sendResponse(res, 200, result, "Cupón aplicado a la deuda");
});

export const deleteDeuda = asyncHandler(async (req, res, next) => {
  const { patientId, deudaId } = req.params;
  const deuda = await PatientDeuda.findOneAndDelete({ _id: deudaId, patientId });
  if (!deuda) return next(new AppError("Deuda no encontrada", 404));
  sendResponse(res, 200, null, "Deuda eliminada");
});
