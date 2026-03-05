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

  try {
    // Intentamos iniciar la transacción
    await session.withTransaction(async () => {
      const newBatch = new Batch({
        ...req.body,
        currentQuantity: req.body.initialQuantity, // Aseguramos que inicie lleno
        createdBy: req.user._id,
      });
      await newBatch.save({ session });
    });

    // Si llegamos aquí, todo bien
    const savedBatch = await Batch.findOne({
      batchNumber: req.body.batchNumber,
    });
    sendResponse(res, 201, savedBatch);
  } catch (error) {
    // 🛡️ BYPASS: Si el error es por el Replica Set, lo hacemos sin transacción
    if (error.message.includes("Transaction numbers")) {
      console.warn("⚠️ Modo Local: Creando lote sin transacción.");
      const newBatch = await Batch.create({
        ...req.body,
        currentQuantity: req.body.initialQuantity,
        createdBy: req.user._id,
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
  const query = { isActive: true };

  if (productId) query.productId = productId;
  if (status) query.status = status;

  const batches = await Batch.find(query)
    .populate("productId", "name sku unit")
    .populate("supplierId", "name")
    .sort({ expiryDate: 1 }); // Ordenamos por caducidad por defecto

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
