import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    }, // Aquí va el código del escáner o el QR generado
    description: { type: String, trim: true },
    currentStock: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["RETAIL", "INSUMO", "EQUIPO"], // Retail = cremas para vender, Insumo = jeringas
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    minStockAlert: { type: Number, default: 5 },
    unit: { type: String, default: "pza", trim: true }, // pza, ml, caja

    // 🔥 CAMPO ESTRATÉGICO
    isTrackable: { type: Boolean, default: true }, // Si es true, obligará a usar Lotes y Caducidad

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Índices para que cuando pasen el escáner, la base de datos lo encuentre en 1 milisegundo
productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);
