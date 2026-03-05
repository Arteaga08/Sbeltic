import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    batchNumber: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    initialQuantity: {
      type: Number,
      required: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "EMPTY", "EXPIRED"],
      default: "AVAILABLE",
    },
    costPerUnit: {
      type: Number,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// ==========================================
// 🚀 ÍNDICES ESTRATÉGICOS (El alma del FEFO)
// ==========================================

// Este índice hace que cuando busquemos stock, MongoDB ya tenga los lotes
// ordenados por caducidad. Sin esto, el checkout de citas sería lento.
batchSchema.index({ productId: 1, expiryDate: 1, status: 1 });

// Índice para buscar rápidamente por número de lote (útil para auditorías)
batchSchema.index({ batchNumber: 1 });

const Batch = mongoose.model("Batch", batchSchema);

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export default Batch;
