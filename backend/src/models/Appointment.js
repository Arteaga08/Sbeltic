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

// --- PRE-SAVE: Prevención atómica de doble reservación (race condition) ---
appointmentSchema.pre("save", async function () {
  if (!this.isNew && !this.isModified("appointmentDate") && !this.isModified("doctorId") && !this.isModified("roomId") && !this.isModified("duration")) {
    return;
  }

  const start = new Date(this.appointmentDate);
  const end = new Date(start.getTime() + this.duration * 60000);

  const botIds = [process.env.BOT_RECEPTIONIST_ID, process.env.BOT_DOCTOR_ID].filter(Boolean);
  const isBotDoctor = botIds.includes(String(this.doctorId));

  const collisionFilter = {
    _id: { $ne: this._id },
    status: { $ne: "CANCELLED" },
    appointmentDate: { $lt: end },
    $expr: {
      $gt: [
        { $add: ["$appointmentDate", { $multiply: ["$duration", 60000] }] },
        start,
      ],
    },
  };

  if (isBotDoctor) {
    collisionFilter.roomId = this.roomId;
  } else {
    collisionFilter.$or = [{ doctorId: this.doctorId }, { roomId: this.roomId }];
  }

  const conflict = await mongoose.model("Appointment").findOne(collisionFilter);

  if (conflict) {
    console.log("⚠️ [PRE-SAVE] Conflicto detectado:", {
      conflictId: conflict._id,
      conflictDoctor: conflict.doctorId,
      conflictRoom: conflict.roomId,
      conflictDate: conflict.appointmentDate,
      newDoctor: this.doctorId,
      newRoom: this.roomId,
      newDate: this.appointmentDate,
    });
    const sameDoctor = String(conflict.doctorId) === String(this.doctorId);
    const reason = sameDoctor
      ? "El personal ya tiene una cita asignada en ese horario."
      : `La habitación/cabina ${this.roomId} ya está ocupada en ese horario.`;
    const err = new Error(reason);
    err.statusCode = 409;
    throw err;
  }
});

export default mongoose.model("Appointment", appointmentSchema);
