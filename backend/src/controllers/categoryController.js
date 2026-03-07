import Category from "../models/inventory/Category.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * 🛡️ UTILIDAD: ESCAPAR REGEX
 * Evita ataques ReDoS escapando caracteres especiales de un string.
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * @desc    Crear nueva categoría
 * @route   POST /api/categories
 * @access  Private (Admin)
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  // 🛡️ CWE-1287 Fix: Validar tipo y limpiar entrada
  const safeName = typeof name === "string" ? name.trim() : "";
  if (!safeName) {
    return next(new AppError("El nombre de la categoría es inválido", 400));
  }

  // 🛡️ ReDoS Fix: Escapar el nombre antes de crear la RegExp
  const escapedName = escapeRegExp(safeName);
  const categoryExists = await Category.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, "i") },
    isActive: true,
  });

  if (categoryExists) {
    return next(
      new AppError("Ya existe una categoría activa con este nombre", 400),
    );
  }

  const category = new Category({
    ...req.body,
    name: safeName, // Usamos el nombre ya saneado
    createdBy: req.user._id,
  });

  await category.save();

  sendResponse(res, 201, category, "Categoría creada exitosamente");
});

/**
 * @desc    Obtener todas las categorías activas
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res, next) => {
  const { type } = req.query;
  const query = { isActive: true };

  if (type && typeof type === "string") {
    query.type = { $in: [type, "ALL"] };
  }

  const categories = await Category.find(query)
    .populate("createdBy", "name")
    .sort({ name: 1 });

  sendResponse(res, 200, categories);
});

/**
 * @desc    Obtener categoría por ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category || !category.isActive) {
    return next(new AppError("Categoría no encontrada", 404));
  }

  sendResponse(res, 200, category);
});

/**
 * @desc    Actualizar categoría
 * @route   PUT /api/categories/:id
 * @access  Private (Admin)
 */
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category || !category.isActive) {
    return next(new AppError("Categoría no encontrada", 404));
  }

  // 🛡️ CWE-1287 & ReDoS Fix: Validación rigurosa del nuevo nombre
  if (req.body.name) {
    const newName =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!newName) {
      return next(new AppError("El formato del nuevo nombre es inválido", 400));
    }

    if (newName.toLowerCase() !== category.name.toLowerCase()) {
      const escapedNewName = escapeRegExp(newName);
      const nameExists = await Category.findOne({
        name: { $regex: new RegExp(`^${escapedNewName}$`, "i") },
        isActive: true,
      });

      if (nameExists) {
        return next(
          new AppError("Ya existe otra categoría con este nombre", 400),
        );
      }

      req.body.name = newName; // Saneamos el body antes de la actualización
    }
  }

  Object.assign(category, req.body);
  await category.save();

  sendResponse(res, 200, category, "Categoría actualizada correctamente");
});

/**
 * @desc    Desactivar categoría (Soft Delete)
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category || !category.isActive) {
    return next(new AppError("Categoría no encontrada", 404));
  }

  category.isActive = false;
  await category.save();

  sendResponse(res, 200, null, "Categoría desactivada correctamente");
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
