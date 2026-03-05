import Coupon from "../models/marketing/Coupon.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * 1. CREAR CUPÓN
 * Valida que el descuento sea lógico y la fecha sea futura.
 */
const createCoupon = asyncHandler(async (req, res, next) => {
  const { discountType, discountValue, expiresAt } = req.body;

  // Validación de lógica comercial
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
 * Permite filtrar por estado (active/expired) para no saturar la vista.
 */
const getCoupons = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = {};

  const now = new Date();

  if (status === "active") {
    // Debe estar marcado como activo Y no haber caducado todavía
    query.isActive = true;
    query.expiresAt = { $gte: now };
    query.usedCount = { $lt: mongoose.rawExpr("this.maxRedemptions") }; // Opcional: filtrar si ya se agotó
  } else if (status === "expired") {
    // Ya pasó la fecha o fue desactivado manualmente
    query.$or = [{ expiresAt: { $lt: now } }, { isActive: false }];
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });
  sendResponse(res, 200, coupons);
});

/**
 * 3. DESACTIVAR CUPÓN (Soft Delete)
 * No eliminamos el registro para no romper el historial de citas pasadas.
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
 * 4. VALIDAR CUPÓN (Para uso interno o del Bot)
 * Solo verifica si el código existe y es aplicable.
 */
const validateCouponCode = asyncHandler(async (req, res, next) => {
  const { code } = req.params;

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiresAt: { $gte: new Date() },
  });

  if (!coupon)
    return next(new AppError("Cupón no válido, agotado o expirado", 404));

  sendResponse(res, 200, coupon, "Cupón válido");
});

// Exportación al final para seguir las buenas prácticas del proyecto
export { createCoupon, getCoupons, deactivateCoupon, validateCouponCode };
