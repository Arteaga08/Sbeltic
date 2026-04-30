import PostOpNoteTemplate from "../models/clinical/PostOpNoteTemplate.js";
import PrescriptionTemplate from "../models/clinical/PrescriptionTemplate.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

// 📝 ============= POST-OP NOTE TEMPLATES =============

const listPostOpNoteTemplates = asyncHandler(async (req, res) => {
  const templates = await PostOpNoteTemplate.find({ isActive: true })
    .sort({ updatedAt: -1 })
    .populate("createdBy", "name role");
  sendResponse(res, 200, templates);
});

const createPostOpNoteTemplate = asyncHandler(async (req, res) => {
  const template = await PostOpNoteTemplate.create({
    ...req.body,
    createdBy: req.user._id,
  });
  sendResponse(res, 201, template, "Plantilla creada correctamente");
});

const updatePostOpNoteTemplate = asyncHandler(async (req, res, next) => {
  const template = await PostOpNoteTemplate.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );
  if (!template) return next(new AppError("Plantilla no encontrada", 404));
  sendResponse(res, 200, template, "Plantilla actualizada correctamente");
});

const deletePostOpNoteTemplate = asyncHandler(async (req, res, next) => {
  const template = await PostOpNoteTemplate.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!template) return next(new AppError("Plantilla no encontrada", 404));
  sendResponse(res, 200, null, "Plantilla desactivada correctamente");
});

// 💊 ============= PRESCRIPTION TEMPLATES =============

const listPrescriptionTemplates = asyncHandler(async (req, res) => {
  const templates = await PrescriptionTemplate.find({ isActive: true })
    .sort({ updatedAt: -1 })
    .populate("createdBy", "name role");
  sendResponse(res, 200, templates);
});

const createPrescriptionTemplate = asyncHandler(async (req, res) => {
  const template = await PrescriptionTemplate.create({
    ...req.body,
    createdBy: req.user._id,
  });
  sendResponse(res, 201, template, "Plantilla creada correctamente");
});

const updatePrescriptionTemplate = asyncHandler(async (req, res, next) => {
  const template = await PrescriptionTemplate.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );
  if (!template) return next(new AppError("Plantilla no encontrada", 404));
  sendResponse(res, 200, template, "Plantilla actualizada correctamente");
});

const deletePrescriptionTemplate = asyncHandler(async (req, res, next) => {
  const template = await PrescriptionTemplate.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!template) return next(new AppError("Plantilla no encontrada", 404));
  sendResponse(res, 200, null, "Plantilla desactivada correctamente");
});

export {
  listPostOpNoteTemplates,
  createPostOpNoteTemplate,
  updatePostOpNoteTemplate,
  deletePostOpNoteTemplate,
  listPrescriptionTemplates,
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  deletePrescriptionTemplate,
};
