import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // --- 1. CORE DEL CALENDARIO ---
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: String,
      enum: ["CABINA_1", "CABINA_2", "CABINA_3", "SPA", "CONSULTORIO", "QUIROFANO"],
      required: [true, "La cabina/habitación es obligatoria para agendar"],
    },
    appointmentDate: { type: Date, required: true },
    duration: { type: Number, default: 30, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "PENDING",
    },

    // --- 2. SERVICIO Y FINANZAS ---
    treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Treatment" },
    treatmentName: { type: String, required: true, trim: true },
    treatmentCategory: { type: String, trim: true },
    originalQuote: { type: Number, default: 0, min: 0 },
    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discountApplied: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, default: 0, min: 0 },

    // --- 3. CHECKOUT CLÍNICO (Inventario) ---
    consumedSupplies: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    // --- 4. REGISTRO CLÍNICO DE LA VISITA ---
    consultationRecord: {
      reasonForVisit: { type: String, trim: true },
      vitalSigns: {
        bloodPressure: { type: String, trim: true },
        heartRate: { type: Number },
        respiratoryRate: { type: Number },
        temperature: { type: Number },
        imc: { type: Number },
      },
      physicalExam: {
        head: { type: String, trim: true },
        neck: { type: String, trim: true },
        thorax: { type: String, trim: true },
        back: { type: String, trim: true },
        abdomen: { type: String, trim: true },
        upperLimbs: { type: String, trim: true },
        lowerLimbs: { type: String, trim: true },
        glutealZone: { type: String, trim: true },
        genitals: { type: String, trim: true },
      },
      labResults: { type: String, trim: true },
      diagnosis: { type: String, trim: true },
      prognosis: { type: String, trim: true },
      therapeuticIndication: { type: String, trim: true },
    },

    // --- 5. METADATOS ---
    isReminderSent: { type: Boolean, default: false },
    nextFollowUpDate: { type: Date },
    isTouchUp: { type: Boolean, default: false },
    touchUpDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// --- ÍNDICES ---
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ roomId: 1, appointmentDate: 1 }); // 🔥 Índice para búsquedas rápidas de cabina
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

export default mongoose.model("Appointment", appointmentSchema);
