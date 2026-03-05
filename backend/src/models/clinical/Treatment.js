import mongoose from "mongoose";

const treatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    performerRole: {
      type: String,
      enum: ["DOCTOR", "RECEPTIONIST", "BOTH"],
      required: true,
    },

    // 🔥 MEJORA 2: Normalización absoluta
    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // Siempre se guardará en mayúsculas
    },

    description: { type: String, trim: true },
    estimatedDuration: { type: Number, default: 30 },

    suggestedTouchUpDays: { type: Number, min: 0 }, // Ej. 14 días para el Bótox
    promotionalPrice: { type: Number, min: 0 }, // Precio del Buen Fin / Mes de las Madres
    promoExpiresAt: { type: Date }, // Cuándo se apaga la promoción aut

    // 🔥 MEJORA 5 (Ajustada): La "Receta Sugerida"
    suggestedMaterials: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        suggestedQuantity: { type: Number, min: 1 },
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// 🔥 MEJORA 1: Índice Compuesto Único (Adiós a 3 "Limpiezas faciales" iguales)
treatmentSchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model("Treatment", treatmentSchema);
