import Supplier from "../models/inventory/Supplier.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * CREAR PROVEEDOR
 * El body ya viene limpio gracias al middleware de Zod
 */
const createSupplier = asyncHandler(async (req, res, next) => {
  const supplier = new Supplier(req.body);
  await supplier.save();

  sendResponse(res, 201, supplier, "Proveedor registrado exitosamente");
});

/**
 * OBTENER TODOS LOS PROVEEDORES
 * Filtra por activos por defecto
 */
const getSuppliers = asyncHandler(async (req, res, next) => {
  const { isActive } = req.query;
  const query = {};

  // Si no se especifica, mostramos solo los activos
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const suppliers = await Supplier.find(query).sort({ name: 1 });

  sendResponse(res, 200, suppliers);
});

/**
 * OBTENER PROVEEDOR POR ID
 */
const getSupplierById = asyncHandler(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return next(new AppError("Proveedor no encontrado", 404));
  }

  sendResponse(res, 200, supplier);
});

/**
 * ACTUALIZAR PROVEEDOR
 */
const updateSupplier = asyncHandler(async (req, res, next) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!supplier) {
    return next(new AppError("Proveedor no encontrado", 404));
  }

  sendResponse(res, 200, supplier, "Datos del proveedor actualizados");
});

export { createSupplier, getSuppliers, getSupplierById, updateSupplier };
