import Product from "../models/inventory/Product.js";
import Category from "../models/inventory/Category.js";
import Batch from "../models/inventory/Batch.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { getUniqueSKU } from "../services/inventoryService.js";

/**
 * @desc    Crear Producto (Con soporte para Lote Inicial)
 * @route   POST /api/products
 * @access  Private (Admin/Receptionist)
 */
const createProduct = asyncHandler(async (req, res, next) => {
  // 1. Extraemos los campos (incluyendo los nuevos del lote inicial)
  let { sku, category, initialQuantity, batchNumber, expirationDate } =
    req.body;

  // 2. Validar que la categoría seleccionada exista y esté activa
  const categoryExists = await Category.findOne({
    _id: category,
    isActive: true,
  });
  if (!categoryExists) {
    return next(
      new AppError("La categoría seleccionada no es válida o no existe", 400),
    );
  }

  // 🛡️ Seguridad en el SKU (Minúsculas para consistencia en Vidix Studio)
  if (sku && typeof sku === "string") {
    sku = sku.trim().toLowerCase();
  }

  if (!sku || sku === "") {
    sku = await getUniqueSKU(categoryExists.name);
  } else {
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return next(
        new AppError("Este código de barras/SKU ya está registrado", 400),
      );
    }
  }

  // 3. Crear el producto base
  const product = new Product({
    ...req.body,
    sku,
    // El stock total del producto nace con lo que recibimos en la entrada inicial
    currentStock:
      initialQuantity && initialQuantity > 0 ? Number(initialQuantity) : 0,
    createdBy: req.user._id,
  });

  await product.save();

  // 📦 4. LÓGICA DEL LOTE INICIAL (Mapeada a tu Modelo Batch)
  if (initialQuantity && initialQuantity > 0) {
  const finalBatchNumber =
    typeof batchNumber === "string" && batchNumber.trim() !== ""
      ? batchNumber
      // 🌟 EXTRA: Protegemos el 'sku' también, por si acaso viene como número o nulo
      : `INIT-${typeof sku === "string" ? sku.substring(0, 4).toUpperCase() : "0000"}`;

    const initialBatch = new Batch({
      productId: product._id, // ✅ Antes era 'product'
      batchNumber: finalBatchNumber,
      initialQuantity: Number(initialQuantity), // ✅ Antes era 'quantity'
      currentQuantity: Number(initialQuantity), // ✅ Campo requerido por tu modelo
      expiryDate: new Date(expirationDate),
      createdBy: req.user._id, // ✅ Antes era 'receivedBy'
    });

    await initialBatch.save();
  }

  // 5. Respuesta final
  const populatedProduct = await product.populate("category", "name type");

  sendResponse(
    res,
    201,
    populatedProduct,
    "Producto y Lote inicial creados exitosamente",
  );
});

/**
 * @desc    Obtener productos (con filtros y búsqueda)
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = asyncHandler(async (req, res, next) => {
  const { category, search, isTrackable } = req.query;
  const query = { isActive: true };

  if (category && typeof category === "string") {
    query.category = category;
  }

  if (isTrackable !== undefined) {
    query.isTrackable = isTrackable === "true";
  }

  if (search && typeof search === "string") {
    query.$text = { $search: search.trim() };
  }

  const products = await Product.find(query)
    .populate("category", "name type")
    .populate("supplierId", "name contactPerson")
    .sort({ name: 1 });

  // 🛡️ LÓGICA DE ICONOS PARA LA INTERFAZ
  const productsWithAlerts = await Promise.all(
    products.map(async (product) => {
      const productObj = product.toObject();

      // 1. Alerta de Stock Bajo
      productObj.isLowStock = product.currentStock <= product.minStockAlert;

      // 2. Próxima Caducidad y Alerta
      if (product.isTrackable) {
        // 🌟 NUEVO: En lugar de solo preguntar si existe, traemos el lote más próximo a vencer
        const closestBatch = await Batch.findOne({
          productId: product._id,
          status: "AVAILABLE",
        }).sort({ expiryDate: 1 }); // Ordenamos del más próximo al más lejano

        if (closestBatch) {
          // Le mandamos la fecha exacta al frontend
          productObj.nextExpiryDate = closestBatch.expiryDate;

          // Mantenemos tu lógica original de alerta de 30 días
          const thresholdDate = new Date();
          thresholdDate.setDate(thresholdDate.getDate() + 30);
          productObj.hasExpiringBatch =
            new Date(closestBatch.expiryDate) <= thresholdDate;
        } else {
          productObj.nextExpiryDate = null;
          productObj.hasExpiringBatch = false;
        }
      } else {
        productObj.nextExpiryDate = null;
        productObj.hasExpiringBatch = false;
      }

      return productObj;
    }),
  );

  sendResponse(res, 200, productsWithAlerts);
});

/**
 * @desc    Obtener producto por ID
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name type description")
    .populate("supplierId", "name contactPerson phone email")
    .populate("createdBy", "name");

  if (!product || !product.isActive) {
    return next(new AppError("Producto no encontrado", 404));
  }

  sendResponse(res, 200, product);
});

/**
 * @desc    Actualizar producto
 * @route   PUT /api/products/:id
 * @access  Private (Admin Only)
 */
const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    return next(new AppError("Producto no encontrado", 404));
  }

  // Si se actualiza la categoría, validamos que exista
  if (req.body.category && req.body.category !== product.category.toString()) {
    const categoryExists = await Category.findOne({
      _id: req.body.category,
      isActive: true,
    });
    if (!categoryExists) {
      return next(new AppError("La nueva categoría no es válida", 400));
    }
  }

  // 🛡️ CWE-1287 Fix: Seguridad en el SKU
  if (req.body.sku) {
    if (typeof req.body.sku === "string") {
      req.body.sku = req.body.sku.trim().toLowerCase();

      if (req.body.sku !== product.sku) {
        const existingSku = await Product.findOne({ sku: req.body.sku });
        if (existingSku) {
          return next(new AppError("Este nuevo SKU ya está en uso", 400));
        }
      }
    } else {
      return next(new AppError("El formato del SKU es inválido", 400));
    }
  }

  Object.assign(product, req.body);
  await product.save();

  const updatedProduct = await product.populate("category", "name type");
  sendResponse(res, 200, updatedProduct, "Producto actualizado correctamente");
});

/**
 * @desc    Desactivar producto (Soft Delete)
 * @route   DELETE /api/products/:id
 * @access  Private (Admin Only)
 */
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    return next(new AppError("Producto no encontrado", 404));
  }

  product.isActive = false;
  await product.save();

  sendResponse(res, 200, null, "Producto desactivado correctamente");
});

/**
 * @desc    Verificar disponibilidad de stock para una lista de insumos
 * @route   POST /api/products/check-availability
 * @access  Private
 */
const checkAvailability = asyncHandler(async (req, res, next) => {
  const { items } = req.body; // [{ productId, quantity }]

  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError("Se requiere una lista de insumos", 400));
  }

  const results = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).select(
      "name currentStock sku",
    );
    if (!product) {
      results.push({
        productId: item.productId,
        available: false,
        reason: "Producto no encontrado",
      });
      continue;
    }

    const sufficient = product.currentStock >= item.quantity;
    results.push({
      productId: item.productId,
      name: product.name,
      requested: item.quantity,
      currentStock: product.currentStock,
      available: sufficient,
      reason: sufficient ? null : `Stock insuficiente (disponible: ${product.currentStock})`,
    });
  }

  const allAvailable = results.every((r) => r.available);

  sendResponse(res, 200, { allAvailable, items: results });
});

export {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  checkAvailability,
};
