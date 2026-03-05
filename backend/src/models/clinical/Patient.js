import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    birthDate: { type: Date },
    address: { type: String, trim: true },
    phone: { type: String, required: true, unique: true },
    allowsWhatsAppNotifications: { type: Boolean, default: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      set: (v) => (v === "" ? null : v),
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    occupation: { type: String, trim: true },
    educationLevel: {
      type: String,
      enum: [
        "POSGRADO",
        "CARRERA",
        "BACHILLERATO",
        "SECUNDARIA",
        "PRIMARIA",
        "SIN ESTUDIOS",
        "OTRO",
      ],
    },
    ethnicity: {
      type: String,
      enum: ["MESTIZO", "INDIGENA", "AFROMERICANO", "OTRO"],
    },
    religion: { type: String, trim: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },

    medicalHistory: {
      bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "DESCONOCIDO"],
        default: "DESCONOCIDO",
      },
      allergies: { food: String, medications: String, others: String },
      missingVaccines: String,
      chronicDiseases: {
        hypertension: { type: Boolean, default: false },
        diabetes: { type: Boolean, default: false },
        thyroid: { type: Boolean, default: false },
        kidney: { type: Boolean, default: false },
        liver: { type: Boolean, default: false },
        other: String,
      },
      currentMedications: String,
      systemReview: {
        heart: String,
        circulation: String,
        coagulation: String,
        lungs: String,
        gastrointestinal: String,
        urinary: String,
        hormonal: String,
        skin: String,
        nervous: String,
      },
    },

    familyHistory: {
      hypertension: String,
      diabetes: String,
      thrombosis: String,
      bleeding: String,
      cancer: String,
      allergies: String,
      other: String,
    },

    gynecologicalHistory: {
      menarcheAge: Number,
      pregnancies: Number,
      naturalBirths: Number,
      lastBirthDate: String,
      cSections: Number,
      lastCSectionDate: String,
      abortions: Number,
      lastAbortionDate: String,
      complications: String,
      lastMenstruationDate: Date,
      cycleDurationDays: Number,
      bleedingDays: Number,
      isIrregular: { type: Boolean, default: false },
      contraceptiveMethod: String,
    },

    pathologicalHistory: {
      surgeries: String,
      surgicalComplications: String,
      hospitalizations: String,
      accidentsAndSequelae: String,
      malformations: String,
      transfusions: String,
      covidHistory: {
        hadCovid: Boolean,
        date: String,
        sequelae: String,
        vaccines: String,
      },
    },

    habits: {
      smoking: String,
      alcohol: String,
      drugs: String,
      exercise: String,
      supplements: String,
      previousAestheticTreatments: [String],
    },

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
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

patientSchema.index({ name: "text", email: "text" });

patientSchema.pre("save", async function () {
  // Al ser async, no necesitas 'next'.
  // Si algo falla, solo lanza un error y Mongoose lo captura.
  if (this.isModified("phone")) {
    this.phone = this.phone.replace(/[^\d+]/g, "");
  }
  // No llames a next(), con ser async es suficiente.
});

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
