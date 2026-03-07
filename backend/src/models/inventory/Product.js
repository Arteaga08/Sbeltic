import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    currentStock: { type: Number, default: 0 },

    // 🔗 CAMBIO CLAVE: Referencia dinámica a la colección de Categorías
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // 💰 PRECIOS: Esenciales para la rentabilidad de la clínica
    purchasePrice: { type: Number, default: 0 }, // Lo que le cuesta a Sbeltic
    salePrice: { type: Number, default: 0 }, // PVP (Solo para RETAIL)

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    minStockAlert: { type: Number, default: 5 },
    unit: { type: String, default: "pza", trim: true }, // pza, ml, caja, vial

    // 🔥 TRAZABILIDAD
    isTrackable: { type: Boolean, default: true }, // Obliga a usar Batches si es true

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// 🚀 ÍNDICES PROFESIONALES
// Búsqueda de texto para el buscador del frontend
productSchema.index({ name: "text", sku: "text" });
// Índice de categoría para los filtros del dashboard
productSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("Product", productSchema);
