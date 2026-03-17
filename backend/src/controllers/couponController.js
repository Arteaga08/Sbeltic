import mongoose from "mongoose"; // 🌟 1. Importamos mongoose
import Coupon from "../models/marketing/Coupon.js";
import AppError from "../utils/appError.js";
import Patient from "../models/clinical/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * 1. CREAR CUPÓN
 */
const createCoupon = asyncHandler(async (req, res, next) => {
  const { discountType, discountValue, expiresAt } = req.body;

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    return next(
      new AppError("El descuento porcentual no puede exceder el 100%", 400),
    );
  }

  if (new Date(expiresAt) <= new Date()) {
    return next(
      new AppError("La fecha de expiración debe ser en el futuro", 400),
    );
  }

  const coupon = new Coupon(req.body);
  await coupon.save();

  sendResponse(res, 201, coupon, "Cupón creado exitosamente");
});

/**
 * 2. OBTENER CUPONES
 */
const getCoupons = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = {};
  const now = new Date();

  if (status === "active") {
    query.isActive = true;
    query.expiresAt = { $gte: now };
    query.usedCount = { $lt: mongoose.rawExpr("this.maxRedemptions") };
  } else if (status === "expired") {
    query.$or = [{ expiresAt: { $lt: now } }, { isActive: false }];
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });
  sendResponse(res, 200, coupons);
});

/**
 * 3. DESACTIVAR CUPÓN (Soft Delete)
 */
const deactivateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true },
  );

  if (!coupon) return next(new AppError("Cupón no encontrado", 404));

  sendResponse(
    res,
    200,
    coupon,
    "Cupón desactivado correctamente para futuros usos",
  );
});

/**
 * 4. VALIDAR CUPÓN (Motor de Marketing)
 */
const validateCouponCode = asyncHandler(async (req, res, next) => {
  // 🌟 2. Ahora lo recibimos del BODY, porque el admin/recepción es quien lo envía
  const { code, patientId } = req.body;

  if (!code || !patientId) {
    return next(
      new AppError("Se requiere el código del cupón y el paciente", 400),
    );
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiresAt: { $gte: new Date() },
  });

  if (!coupon) return next(new AppError("Cupón no válido o expirado", 404));

  // 1. Validar límite GLOBAL
  if (coupon.usedCount >= coupon.maxRedemptions) {
    return next(new AppError("Este cupón se ha agotado", 400));
  }

  // 2. Validar límite POR USUARIO (maxUsesPerUser)
  const userUsageCount = coupon.usedBy.filter(
    (usage) => usage.patientId.toString() === patientId,
  ).length;

  if (userUsageCount >= coupon.maxUsesPerUser) {
    return next(
      new AppError(
        "El paciente ya ha utilizado este cupón el máximo de veces permitido",
        400,
      ),
    );
  }

  // 3. Validar tipo BIENVENIDA
  if (coupon.type === "WELCOME") {
    const patient = await Patient.findById(patientId);
    if (!patient) return next(new AppError("Paciente no encontrado", 404));

    if (patient.evolutions && patient.evolutions.length > 0) {
      return next(
        new AppError(
          "Este cupón es exclusivo para pacientes de primera visita",
          400,
        ),
      );
    }
  }

  // 4. Validar REFERIDOS
  if (coupon.type === "REFERRAL") {
    if (
      coupon.referralConfig?.maxShares > 0 &&
      coupon.usedCount >= coupon.referralConfig.maxShares
    ) {
      return next(
        new AppError("Este cupón de referido ya alcanzó su límite", 400),
      );
    }
  }

  sendResponse(res, 200, coupon, "Cupón válido y aplicable");
});

export { createCoupon, getCoupons, deactivateCoupon, validateCouponCode };
