import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT"],
      required: true,
    },
    discountValue: { type: Number, required: true },

    // Para referidos: ¿Quién es el dueño de este cupón?
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },

    // Restricciones
    minPurchase: { type: Number, default: 0 },
    maxRedemptions: { type: Number, default: 1 }, // Cuántas veces se puede usar en TOTAL
    usedCount: { type: Number, default: 0 },

    // Si solo aplica a una categoría (ej: solo DEPILACIÓN)
    applicableCategory: { type: String, uppercase: true },

    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", couponSchema);
