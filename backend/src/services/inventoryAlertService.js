import Product from "../models/inventory/Product.js";
import Batch from "../models/inventory/Batch.js";
import Coupon from "../models/marketing/Coupon.js";

/**
 * 🔍 DETECTOR DE STOCK CRÍTICO
 * Busca productos cuyo stock actual sea igual o menor al mínimo configurado.
 */
const getLowStockProducts = async () => {
  return await Product.find({
    isActive: true,
    $expr: { $lte: ["$currentStock", "$minStockAlert"] },
  }).populate("category", "name");
};

/**
 * 🔍 DETECTOR DE CADUCIDADES
 * Busca lotes que venzan en los próximos 'days' (por defecto 30).
 */
const getExpiringBatches = async (days = 30) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + days);

  return await Batch.find({
    status: "AVAILABLE",
    currentQuantity: { $gt: 0 },
    expiryDate: { $lte: thresholdDate, $gte: new Date() },
  }).populate("productId", "name sku");
};

/**
 * 🏷️ ACTIVADOR DE CUPONES CLEARANCE
 * Para cada producto con stock crítico, activa cualquier cupón CLEARANCE
 * que tenga ese producto en clearanceConfig.applicableProducts.
 * Retorna la cantidad de cupones activados.
 */
const activateClearanceCoupons = async (lowStockProducts) => {
  if (!lowStockProducts.length) return 0;

  const productIds = lowStockProducts.map((p) => p._id);

  const couponsToActivate = await Coupon.find({
    type: "CLEARANCE",
    isActive: false,
    "clearanceConfig.applicableProducts": { $in: productIds },
  });

  for (const coupon of couponsToActivate) {
    coupon.isActive = true;
    await coupon.save();
    console.log(
      `🏷️ [CLEARANCE] Cupón "${coupon.code}" activado automáticamente por stock bajo.`,
    );
  }

  return couponsToActivate.length;
};

export { getLowStockProducts, getExpiringBatches, activateClearanceCoupons };
