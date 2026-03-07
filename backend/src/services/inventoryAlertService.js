import Product from "../models/inventory/Product.js";
import Batch from "../models/inventory/Batch.js";

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

export { getLowStockProducts, getExpiringBatches };
