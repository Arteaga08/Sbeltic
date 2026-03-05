import Treatment from "../models/clinical/Treatment.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

const getTreatments = asyncHandler(async (req, res, next) => {
  const { category, performerRole } = req.query;
  const query = { isActive: true };

  // 🛡️ CWE-1287 Fix: Validar que la categoría sea un string antes de mutarla
  if (category) {
    if (typeof category !== "string") {
      return next(new AppError("El formato de la categoría es inválido", 400));
    }
    query.category = category.toUpperCase();
  }

  // 🛡️ CWE-1287 Proactive Fix: Validar también performerRole
  if (performerRole) {
    if (typeof performerRole !== "string") {
      return next(new AppError("El formato del rol es inválido", 400));
    }
    query.performerRole = performerRole;
  }

  // 🔥 MEJORA 3: Paginación real
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const treatments = await Treatment.find(query)
    .sort({ category: 1, name: 1 })
    .skip(skip)
    .limit(limit);

  // Es buena práctica devolver también el total de páginas para el frontend
  const total = await Treatment.countDocuments(query);

  sendResponse(res, 200, {
    results: treatments,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

const createTreatment = asyncHandler(async (req, res, next) => {
  const treatment = new Treatment(req.body);
  await treatment.save();
  sendResponse(res, 201, treatment, "Tratamiento creado exitosamente");
});

const updateTreatment = asyncHandler(async (req, res, next) => {
  const treatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!treatment) return next(new AppError("Tratamiento no encontrado", 404));
  sendResponse(res, 200, treatment, "Tratamiento actualizado exitosamente");
});

// 🔥 MEJORA 4: Soft Delete Real
const deactivateTreatment = asyncHandler(async (req, res, next) => {
  const treatment = await Treatment.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!treatment) return next(new AppError("Tratamiento no encontrado", 404));

  sendResponse(res, 200, treatment, "Tratamiento desactivado exitosamente");
});

export { getTreatments, createTreatment, updateTreatment, deactivateTreatment };
