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
    // 🌟 NUEVO: Categoría del cupón
    type: {
      type: String,
      enum: ["WELCOME", "REFERRAL", "SEASONAL", "CLEARANCE"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT"],
      required: true,
    },
    discountValue: { type: Number, required: true },

    // Restricciones de tu código original
    minPurchase: { type: Number, default: 0 },
    maxRedemptions: { type: Number, default: 1 }, // Límite global de usos
    usedCount: { type: Number, default: 0 },
    applicableCategory: { type: String, uppercase: true }, // Ej: FACIALES
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    // 🛡️ NUEVOS CANDADOS GLOBALES
    maxUsesPerUser: { type: Number, default: 1 }, // Límite por paciente
    isCumulative: { type: Boolean, default: false }, // ¿Se combina con otros?
    usedBy: [
      {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        usedAt: { type: Date, default: Date.now },
      },
    ],

    // 🎯 CONFIGURACIONES ESPECÍFICAS
    referralConfig: {
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }, // Sustituye tu antiguo "referredBy"
      maxShares: { type: Number, default: 0 },
    },
    clearanceConfig: {
      applicableProducts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", couponSchema);
