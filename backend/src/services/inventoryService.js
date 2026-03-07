import Batch from "../models/inventory/Batch.js";
import Product from "../models/inventory/Product.js";
import AppError from "../utils/appError.js";

/**
 * 🎫 GENERADOR DE SKU ÚNICO
 * Usa el nombre de la categoría para el prefijo.
 */
const getUniqueSKU = async (categoryName) => {
  // Manejamos si el nombre es corto para evitar errores de substring
  const prefix = categoryName.substring(0, 3).toUpperCase().padEnd(3, "X");
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
 * 📦 REGISTRO DE ENTRADA (Lotes)
 * Crea el lote y actualiza el stock global del producto.
 */
const addBatchToInventory = async (batchData, session) => {
  const { productId, initialQuantity } = batchData;

  const product = await Product.findById(productId).session(session);
  if (!product)
    throw new AppError("Producto no encontrado para asignar lote", 404);

  // 1. Creamos el lote físico
  const newBatch = new Batch({
    ...batchData,
    currentQuantity: initialQuantity, // Al entrar, el actual es igual al inicial
  });
  await newBatch.save({ session });

  // 2. Actualizamos el stock global del producto
  product.currentStock += initialQuantity;
  await product.save({ session });

  return newBatch;
};

/**
 * 🧠 MOTOR FEFO (First Expired, First Out)
 * Descuenta stock de los lotes que caducan más pronto.
 */
const deductInventoryFEFO = async (productId, quantityToDeduct, session) => {
  let remainingToDeduct = quantityToDeduct;

  const product = await Product.findById(productId).session(session);
  if (!product) throw new AppError(`Producto no encontrado: ${productId}`, 404);

  // Validación de seguridad antes de empezar
  if (product.currentStock < quantityToDeduct) {
    throw new AppError(
      `Stock insuficiente para ${product.name}. Requerido: ${quantityToDeduct}, Disponible: ${product.currentStock}`,
      400,
    );
  }

  // 1. Caso: Producto No Trackable (ej. Gasas genéricas o servicios)
  if (!product.isTrackable) {
    product.currentStock -= remainingToDeduct;
    await product.save({ session });
    return;
  }

  // 2. Caso: FEFO (First Expired, First Out)
  const availableBatches = await Batch.find({
    productId,
    status: "AVAILABLE",
    currentQuantity: { $gt: 0 },
  })
    .sort({ expiryDate: 1 }) // El que caduca antes va primero
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

    // Si el lote se acaba, lo marcamos como EMPTY
    if (batch.currentQuantity === 0) batch.status = "EMPTY";
    await batch.save({ session });
  }

  // 3. Actualización final del stock global
  product.currentStock -= quantityToDeduct;
  await product.save({ session });

  // Doble check de seguridad
  if (remainingToDeduct > 0) {
    throw new AppError(
      `Fallo crítico: No hubo suficientes lotes específicos para cubrir el descuento de ${product.name}`,
      500,
    );
  }
};

export { getUniqueSKU, addBatchToInventory, deductInventoryFEFO };
