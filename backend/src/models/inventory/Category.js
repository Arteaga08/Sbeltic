import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Evitamos categorías duplicadas como "Ácido Hialurónico" y "acido hialuronico"
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["RETAIL", "INSUMO", "EQUIPO", "ALL"],
      default: "ALL",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Índice para búsquedas rápidas al filtrar el inventario
categorySchema.index({ name: 1, type: 1 });

export default mongoose.model("Category", categorySchema);
