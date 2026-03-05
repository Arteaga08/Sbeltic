import Batch from "../models/inventory/Batch.js";
import Product from "../models/inventory/Product.js";
import AppError from "../utils/appError.js";

/**
 * 🎫 GENERADOR DE SKU ÚNICO
 * Crea un código automático basado en la categoría si el usuario no escanea uno.
 */
const getUniqueSKU = async (category) => {
  const prefix = category.substring(0, 3).toUpperCase();
  let isUnique = false;
  let sku = "";

  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    sku = `${prefix}-${randomDigits}`;

    const existingProduct = await Product.findOne({ sku });
    if (!existingProduct) isUnique = true;
  }

  return sku;
};

/**
 * 🧠 MOTOR FEFO (First Expired, First Out)
 * Descuenta stock de los lotes que caducan más pronto.
 */
const deductInventoryFEFO = async (productId, quantityToDeduct, session) => {
  let remainingToDeduct = quantityToDeduct;

  const product = await Product.findById(productId).session(session);
  if (!product) throw new AppError(`Producto no encontrado: ${productId}`, 404);

  // Si el producto no es trackable (ej. un servicio manual), restamos del stock general
  if (!product.isTrackable) {
    product.currentStock -= remainingToDeduct;
    await product.save({ session });
    return;
  }

  if (product.currentStock < quantityToDeduct) {
    throw new AppError(
      `Stock insuficiente para ${product.name}. Requerido: ${quantityToDeduct}, Disponible: ${product.currentStock}`,
      400,
    );
  }

  // Buscamos lotes AVAILABLE ordenados por fecha de caducidad
  const availableBatches = await Batch.find({
    productId,
    status: "AVAILABLE",
    currentQuantity: { $gt: 0 },
  })
    .sort({ expiryDate: 1 })
    .session(session);

  for (const batch of availableBatches) {
    if (remainingToDeduct <= 0) break;

    if (batch.currentQuantity >= remainingToDeduct) {
      batch.currentQuantity -= remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      remainingToDeduct -= batch.currentQuantity;
      batch.currentQuantity = 0;
    }

    if (batch.currentQuantity === 0) batch.status = "EMPTY";
    await batch.save({ session });
  }

  // Actualización final del stock global
  product.currentStock -= quantityToDeduct;
  await product.save({ session });

  if (remainingToDeduct > 0) {
    throw new Error(
      `Fallo crítico: No hubo suficientes lotes para cubrir el descuento de ${product.name}`,
    );
  }
};

export { getUniqueSKU, deductInventoryFEFO };
