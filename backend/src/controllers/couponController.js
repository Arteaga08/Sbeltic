import Coupon from "../models/marketing/Coupon.js";
import AppError from "../utils/appError.js";
import Patient from "../models/clinical/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { buildTemplateComponents, TEMPLATE_MAP } from "../services/automationService.js";
import { sendWhatsAppTemplate } from "../services/whatsappService.js";

/**
 * Helper: Calcula nextSendAt inicial para cupones WEEKLY/MONTHLY
 */
function initNextSendAt(schedule) {
  if (!schedule) return null;
  const { frequency, sendHour = 8, dayOfWeek, dayOfMonth } = schedule;

  const now = new Date();
  const next = new Date(now);
  next.setHours(sendHour, 0, 0, 0);

  if (frequency === "WEEKLY") {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek ?? 1;
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  if (frequency === "MONTHLY") {
    const targetDay = Math.min(dayOfMonth ?? 1, 28);
    next.setDate(targetDay);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return next;
  }

  return null;
}

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
  const nextSend = initNextSendAt(req.body.schedule);
  if (nextSend) coupon.schedule.nextSendAt = nextSend;
  await coupon.save();

  sendResponse(res, 201, coupon, "Cupón creado exitosamente");
});

/**
 * 2. OBTENER CUPONES
 */
const getCoupons = asyncHandler(async (req, res, next) => {
  const { status, type } = req.query;
  const query = {};
  const now = new Date();

  if (status === "active") {
    query.isActive = true;
    query.expiresAt = { $gte: now };
    query.$expr = { $lt: ["$usedCount", "$maxRedemptions"] };
  } else if (status === "expired") {
    query.$or = [{ expiresAt: { $lt: now } }, { isActive: false }];
  }

  if (type) query.type = type;

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
  const { code, patientId } = req.body;

  if (!code || typeof code !== "string" || !patientId) {
    return next(
      new AppError(
        "Se requiere un código de cupón válido (texto) y el paciente",
        400,
      ),
    );
  }

  const safeCode = code.toUpperCase();

  const coupon = await Coupon.findOne({
    code: safeCode,
    isActive: true,
    expiresAt: { $gte: new Date() },
  });

  if (!coupon) return next(new AppError("Cupón no válido o expirado", 404));

  if (coupon.usedCount >= coupon.maxRedemptions) {
    return next(new AppError("Este cupón se ha agotado", 400));
  }

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

/**
 * 5. ESTADÍSTICAS GLOBALES DE MARKETING
 */
const getCouponStats = asyncHandler(async (req, res) => {
  const [referralCount, welcomeCoupons, usedCoupons] = await Promise.all([
    Coupon.countDocuments({ type: "REFERRAL", usedCount: { $gt: 0 } }),
    Coupon.find({ type: "WELCOME" }),
    Coupon.find({ usedCount: { $gt: 0 } }),
  ]);

  const welcomeUsed = welcomeCoupons.filter((c) => c.usedCount > 0).length;
  const conversionRate =
    welcomeCoupons.length > 0
      ? Math.round((welcomeUsed / welcomeCoupons.length) * 100)
      : 0;

  const totalSavings = usedCoupons.reduce((acc, c) => {
    if (c.discountType === "FIXED_AMOUNT") {
      return acc + c.usedCount * c.discountValue;
    }
    return acc;
  }, 0);

  sendResponse(res, 200, {
    conversionRate,
    totalReferrals: referralCount,
    totalSavings,
  });
});

/**
 * 6. OBTENER CUPÓN POR ID
 */
const getCouponById = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError("Cupón no encontrado", 404));
  sendResponse(res, 200, coupon);
});

/**
 * 7. ACTUALIZAR CUPÓN
 */
const updateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError("Cupón no encontrado", 404));

  if (req.body.code && req.body.code !== coupon.code) {
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return next(new AppError("Ya existe un cupón con ese código", 400));
    }
  }

  if (req.body.schedule) {
    const merged = { ...coupon.schedule.toObject(), ...req.body.schedule };
    const nextSend = initNextSendAt(merged);
    if (nextSend) req.body.schedule.nextSendAt = nextSend;
  }

  Object.assign(coupon, req.body);
  await coupon.save();

  sendResponse(res, 200, coupon, "Cupón actualizado correctamente");
});

/**
 * 8. ENVIAR CUPÓN AHORA (Manual)
 */
const sendCouponNow = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError("Cupón no encontrado", 404));
  if (!coupon.isActive) return next(new AppError("El cupón no está activo", 400));

  const patients = await Patient.find({
    isActive: true,
    allowsWhatsAppNotifications: true,
  }).select("name phone");

  if (patients.length === 0) {
    return sendResponse(res, 200, { sent: 0 }, "No hay pacientes con WhatsApp habilitado");
  }

  const templateName = coupon.whatsappTemplateName || TEMPLATE_MAP[coupon.type];
  if (!templateName) return next(new AppError("El cupón no tiene plantilla de WhatsApp configurada", 400));

  let sent = 0;
  for (const patient of patients) {
    const components = buildTemplateComponents(coupon, patient);
    const result = await sendWhatsAppTemplate(patient.phone, templateName, "es_MX", components);
    if (result.success) sent++;
    await Patient.updateOne({ _id: patient._id }, { $addToSet: { walletCoupons: coupon._id } });
    coupon.sentTo.push({ patientId: patient._id, sentAt: new Date() });
  }

  coupon.schedule.lastSentAt = new Date();
  await coupon.save();

  sendResponse(res, 200, { sent }, `Cupón enviado a ${sent} paciente(s)`);
});

/**
 * 9. ELIMINAR CUPÓN (Hard Delete)
 */
const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError("Cupón no encontrado", 404));
  sendResponse(res, 200, null, "Cupón eliminado permanentemente");
});

export {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
  validateCouponCode,
  getCouponStats,
  deleteCoupon,
  sendCouponNow,
};
