import mongoose from "mongoose";
import Batch from "../models/inventory/Batch.js";
import Product from "../models/inventory/Product.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * REGISTRAR ENTRADA DE LOTE
 * - Crea el Batch
 * - Suma la cantidad al 'currentStock' del Product automáticamente
 */

const createBatch = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  const { productId, initialQuantity } = req.body;

  try {
    let savedBatch;
    await session.withTransaction(async () => {
      // 1. Crear el Lote
      const newBatch = new Batch({
        ...req.body,
        currentQuantity: initialQuantity,
        createdBy: req.user._id,
      });
      savedBatch = await newBatch.save({ session });

      // 2. ⚡ ACTUALIZAR STOCK GLOBAL (Lo que faltaba)
      const product = await Product.findById(productId).session(session);
      if (!product) throw new AppError("Producto no encontrado", 404);

      product.currentStock += initialQuantity;
      await product.save({ session });
    });

    sendResponse(res, 201, savedBatch, "Lote registrado y stock actualizado");
  } catch (error) {
    // ... tu lógica de bypass para local ...
    if (error.message.includes("Transaction numbers")) {
      const newBatch = await Batch.create({
        ...req.body,
        currentQuantity: initialQuantity,
        createdBy: req.user._id,
      });
      // También hay que actualizar el stock en el bypass
      await Product.findByIdAndUpdate(productId, {
        $inc: { currentStock: initialQuantity },
      });
      return sendResponse(res, 201, newBatch);
    }
    next(error);
  } finally {
    session.endSession();
  }
});

const getBatches = asyncHandler(async (req, res, next) => {
  const { productId, status } = req.query;
  const query = {};

  if (productId) query.productId = productId;
  if (status) query.status = status;

  const batches = await Batch.find(query)
    .populate("productId", "name sku unit")
    .populate("supplierId", "name")
    .sort({ expiryDate: 1 });

  sendResponse(res, 200, batches);
});

/**
 * ACTUALIZAR LOTE
 * Solo permite editar información de referencia, NO cantidades.
 * Las cantidades solo bajan por consumo en citas.
 */
const updateBatch = asyncHandler(async (req, res, next) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return next(new AppError("Batch not found", 404));

  Object.assign(batch, req.body);

  // Si manualmente lo marcan como vacío, o la fecha ya pasó
  if (batch.status === "AVAILABLE" && batch.currentQuantity === 0) {
    batch.status = "EMPTY";
  }

  await batch.save();

  sendResponse(res, 200, batch, "Batch updated successfully");
});

export { createBatch, getBatches, updateBatch };
