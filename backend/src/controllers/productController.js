import Product from "../models/inventory/Product.js";
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

  // 🛡️ CWE-1287 Fix: Validar que sea un string antes de usar métodos de texto
  if (sku && typeof sku === "string") {
    sku = sku.trim().toUpperCase();
  } else if (sku && typeof sku !== "string") {
    return next(new AppError("El formato del SKU es inválido", 400));
  }

  if (!sku || sku === "") {
    // Generación interna segura
    sku = await getUniqueSKU(category);
  } else {
    // Validamos duplicado
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return next(
        new AppError(
          "Este código de barras/SKU ya está registrado en otro producto",
          400,
        ),
      );
    }
  }

  const product = new Product({
    ...req.body,
    sku,
    createdBy: req.user._id,
  });

  await product.save();

  sendResponse(res, 201, product, "Producto creado exitosamente");
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

  // 🛡️ CWE-1287 Fix: Validar que la búsqueda sea estrictamente un string
  if (search && typeof search === "string") {
    query.$text = { $search: search.trim() };
  }

  const products = await Product.find(query)
    .populate("supplierId", "name contactPerson")
    .sort({ name: 1 });

  sendResponse(res, 200, products);
});

/**
 * @desc    Obtener producto por ID
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
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

  // 🛡️ CWE-1287 Fix: Seguridad en la actualización del SKU
  if (req.body.sku) {
    if (typeof req.body.sku === "string") {
      req.body.sku = req.body.sku.trim().toUpperCase();
    } else {
      return next(new AppError("El formato del nuevo SKU es inválido", 400));
    }
  }

  // Seguridad: SKU único
  if (req.body.sku && req.body.sku !== product.sku) {
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      return next(
        new AppError("Este nuevo SKU ya está en uso por otro producto", 400),
      );
    }
  }

  // Zod ya limpió req.body con .strict(), es seguro hacer el merge
  Object.assign(product, req.body);

  await product.save();

  sendResponse(res, 200, product, "Producto actualizado correctamente");
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
