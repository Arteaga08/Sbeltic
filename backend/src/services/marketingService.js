import Coupon from "../models/marketing/Coupon.js";
import AppError from "../utils/appError.js";

/**
 * Valida un cupón y calcula el descuento final
 */
export const validateAndApplyCoupon = async ({
  couponCode,
  originalQuote,
  category,
  session,
}) => {
  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
  }).session(session);

  // 1. Validaciones de existencia y estado
  if (!coupon) throw new AppError("Cupón inválido o inactivo", 400);

  if (coupon.expiresAt < new Date()) {
    coupon.isActive = false;
    await coupon.save({ session });
    throw new AppError("Este cupón ha caducado", 400);
  }

  if (coupon.usedCount >= coupon.maxRedemptions) {
    coupon.isActive = false;
    await coupon.save({ session });
    throw new AppError("Este cupón ha alcanzado su límite de usos", 400);
  }

  // 2. Validación de categoría (Ej: Cupón solo para BÓTOX)
  if (
    coupon.applicableCategory &&
    coupon.applicableCategory !== category.toUpperCase()
  ) {
    throw new AppError(
      `Este cupón solo aplica para la categoría ${coupon.applicableCategory}`,
      400,
    );
  }

  // 3. Validación de monto mínimo
  if (originalQuote < coupon.minPurchase) {
    throw new AppError(
      `La compra mínima para este cupón es de $${coupon.minPurchase}`,
      400,
    );
  }

  // 4. Cálculo de matemática financiera
  let discountApplied = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountApplied = originalQuote * (coupon.discountValue / 100);
  } else {
    discountApplied = coupon.discountValue;
  }

  // Asegurar que el descuento no supere el total (por si acaso)
  if (discountApplied > originalQuote) discountApplied = originalQuote;

  const finalAmount = originalQuote - discountApplied;

  // 5. Devolver resultados y el objeto cupón para "quemarlo" después
  return {
    discountApplied,
    finalAmount,
    couponId: coupon._id,
    couponDoc: coupon, // Lo devolvemos para actualizar el usedCount en el controlador
  };
};
