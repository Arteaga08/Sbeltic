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
    // 🌟 Categoría del cupón
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

    // Restricciones
    minPurchase: { type: Number, default: 0 },
    maxRedemptions: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    applicableCategory: { type: String, uppercase: true },
    expiresAt: { type: Date, required: true },

    // (Solo dejamos un isActive)
    isActive: { type: Boolean, default: true },

    // 🛡️ CANDADOS GLOBALES
    maxUsesPerUser: { type: Number, default: 1 },
    isCumulative: { type: Boolean, default: false },
    usedBy: [
      {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        usedAt: { type: Date, default: Date.now },
      },
    ],

    // 🌟 El mensaje del admin
    whatsappMessageTemplate: {
      type: String,
      required: true,
    },

    // 🎯 CONFIGURACIONES ESPECÍFICAS
    referralConfig: {
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      maxShares: { type: Number, default: 0 },
    },
    clearanceConfig: {
      applicableProducts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      ],
    },

    // 📅 PROGRAMACIÓN DE ENVÍO
    schedule: {
      frequency: {
        type: String,
        enum: ["ONCE", "WEEKLY", "MONTHLY", "AUTO"],
        default: "ONCE",
      },
      sendHour: { type: Number, default: 8 },       // hora del día 0-23
      dayOfWeek: { type: Number },                   // 0=Dom ... 6=Sáb (WEEKLY)
      dayOfMonth: { type: Number },                  // 1-31 (MONTHLY)
      triggerEvent: {
        type: String,
        enum: ["MANUAL", "ON_NEW_PATIENT", "ON_LOW_STOCK", "ON_APPOINTMENT_COMPLETE"],
        default: "MANUAL",
      },
      delayDays: { type: Number, default: 0 },       // días de retraso post-evento
      lastSentAt: { type: Date },
      nextSendAt: { type: Date },
    },
  },
  { timestamps: true },
);

// 🌟 LA SOLUCIÓN MÁGICA PARA NEXT.JS + MONGOOSE
// Si el modelo ya existe en memoria, lo usa. Si no, lo crea. Esto evita el Error 500.
export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
