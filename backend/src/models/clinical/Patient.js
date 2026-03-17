import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      set: (v) => (v === "" ? null : v),
    },
    allowsWhatsAppNotifications: { type: Boolean, default: true },
    patientType: {
      type: String,
      enum: ["SPA", "INJECTION", "LEAD", "SURGERY", "POST_OP", "OTHER"],
      default: "SPA",
      required: true,
    },

    medicalHistory: {
      identification: { type: Object, default: {} },
      allergies: { type: Object, default: {} },
      vital: { type: Object, default: {} },
      comorbidities: { type: Object, default: {} },
      family: { type: Object, default: {} },
      gyneco: { type: Object, default: {} },
      systems: { type: Object, default: {} },
      pathological: { type: Object, default: {} },
      habits: { type: Object, default: {} },
      currentCondition: { type: Object, default: {} },
    },

    // Datos administrativos internos de Sbeltic
    isProfileComplete: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, sparse: true, trim: true },
    walletCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }],
    clinicalNotes: [
      {
        note: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    evolutions: [
      {
        vitals: { type: Object, default: {} }, // TA, FC, FR, TEMP, IMC
        physicalExam: { type: Object, default: {} }, // Habitus, Cabeza, Cuello...
        labResults: { type: String },
        diagnosis: { type: String },
        prognosis: { type: String },
        indications: { type: String },

        // Firmas en Base64
        patientSignature: { type: String },
        doctorSignature: { type: String },
        doctorName: { type: String },
        doctorLicense: { type: String },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Firma del paciente para el historial clínico inicial
    historySignature: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

patientSchema.index({ name: "text", email: "text" });

patientSchema.pre("save", async function () {
  if (this.isModified("phone")) {
    this.phone = this.phone.replace(/[^\d+]/g, "");
  }
});

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
