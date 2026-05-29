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
    dateOfBirth: { type: Date },
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

    // 📝 Notas post-operatorias (rellenadas desde plantillas reutilizables)
    postOpNotes: [
      {
        title: { type: String, required: true },
        body: { type: String, required: true },
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PostOpNoteTemplate",
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🩺 Notas clínicas del doctor en formato SOAP (Subjetivo, Objetivo, Análisis, Plan)
    soapNotes: [
      {
        title: { type: String, default: "" }, // título/etiqueta opcional de la consulta
        subjective: { type: String, default: "" }, // S - Subjetivo
        objective: { type: String, default: "" }, // O - Objetivo
        assessment: { type: String, default: "" }, // A - Análisis/Evaluación
        plan: { type: String, default: "" }, // P - Plan
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SoapNoteTemplate",
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 📸 Fotos antes/después (solo ADMIN; archivos en filesystem vía Docker volume)
    photos: [
      {
        type: {
          type: String,
          enum: ["BEFORE", "AFTER", "POST_OP", "EVOLUCION"],
          required: true,
          index: true,
        },
        date: { type: Date, required: true },
        caption: { type: String, trim: true, default: "" },
        webUrl: { type: String, required: true },
        thumbUrl: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 💊 Recetas médicas estructuradas (impresas como PDF)
    prescriptions: [
      {
        title: { type: String, required: true },
        medications: [
          {
            name: { type: String, required: true },
            presentation: { type: String, default: "" },
            dose: { type: String, default: "" },
            route: { type: String, default: "" },
            frequency: { type: String, default: "" },
            duration: { type: String, default: "" },
          },
        ],
        generalIndications: { type: String, default: "" },
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PrescriptionTemplate",
        },
        doctorName: { type: String, default: "" },
        doctorLicense: { type: String, default: "" },
        doctorSignature: { type: String, default: "" }, // base64 opcional
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Firma del paciente para el historial clínico inicial
    historySignature: { type: String },

    // Tokens temporales para links de firma (seguridad anti-enumeración)
    signatureTokens: [
      {
        token: { type: String, required: true },
        targetId: { type: String, required: true }, // patientId o evolutionId
        type: { type: String, enum: ["HISTORY", "EVOLUTION", "MEDICAL_HISTORY_FORM"], required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false },
      },
    ],

    consentGiven: { type: Boolean, default: false },
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
