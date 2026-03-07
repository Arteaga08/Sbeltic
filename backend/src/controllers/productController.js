import Product from "../models/inventory/Product.js";
import Category from "../models/inventory/Category.js";
import Batch from "../models/inventory/Batch.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { getUniqueSKU } from "../services/inventoryService.js";

/**
 * @desc    Crear Producto
 * @route   POST /api/products
 * @access  Private (Admin/Receptionist)
 */
const createProduct = asyncHandler(async (req, res, next) => {
  let { sku, category } = req.body;

  // 1. Validar que la categoría seleccionada exista y esté activa
  const categoryExists = await Category.findOne({
    _id: category,
    isActive: true,
  });
  if (!categoryExists) {
    return next(
      new AppError("La categoría seleccionada no es válida o no existe", 400),
    );
  }

  // 🛡️ CWE-1287 Fix: Seguridad en el SKU
  if (sku && typeof sku === "string") {
    sku = sku.trim().toUpperCase();
  } else if (sku && typeof sku !== "string") {
    return next(new AppError("El formato del SKU es inválido", 400));
  }

  if (!sku || sku === "") {
    // Usamos el nombre de la categoría para el prefijo del SKU automático
    sku = await getUniqueSKU(categoryExists.name);
  } else {
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return next(
        new AppError("Este código de barras/SKU ya está registrado", 400),
      );
    }
  }

  const product = new Product({
    ...req.body,
    sku,
    createdBy: req.user._id,
  });

  await product.save();

  // Devolvemos el producto con la categoría populada para el frontend
  const populatedProduct = await product.populate("category", "name type");

  sendResponse(res, 201, populatedProduct, "Producto creado exitosamente");
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

      // 2. Alerta de Caducidad (Próximos 30 días)
      if (product.isTrackable) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + 30);

        const expiringBatch = await Batch.exists({
          productId: product._id,
          status: "AVAILABLE",
          expiryDate: { $lte: thresholdDate, $gte: new Date() },
        });

        productObj.hasExpiringBatch = !!expiringBatch;
      } else {
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
      req.body.sku = req.body.sku.trim().toUpperCase();

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

export {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
