import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      unique: true,
      lowercase: true, // 🔥 CAMBIO: Ahora forzará minúsculas en la BD
      trim: true,
    },
    brand: { type: String, trim: true }, // 🔥 NUEVO: Marca
    amount: { type: String, trim: true }, // 🔥 NUEVO: Presentación (Ej: 100ml, 50U)
    description: { type: String, trim: true },
    currentStock: { type: Number, default: 0 },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 }, // Sigue existiendo, pero si no lo mandan será 0

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    minStockAlert: { type: Number, default: 5 },
    unit: { type: String, default: "unidades", trim: true },

    isTrackable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", sku: "text", brand: "text" }); // Añadimos marca al buscador
productSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("Product", productSchema);
