import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["ADMIN", "RECEPTIONIST", "DOCTOR", "MARKETING", "NURSE", "PHYSIOTHERAPIST"],
      default: "RECEPTIONIST",
    },
    phone: String,
    schedule: [
      {
        day: { type: Number, min: 0, max: 6 }, // 0=Dom, 1=Lun, ..., 6=Sáb
        startTime: { type: String },            // "09:00"
        endTime: { type: String },              // "18:00"
      },
    ],
    // --- COMISIÓN (solo aplica a colaboradores: DOCTOR / PHYSIOTHERAPIST) ---
    // Comisión que el admin recibe por cada paciente atendido por el colaborador.
    commissionType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
    },
    // Si PERCENTAGE => porcentaje sobre lo ganado. Si FIXED => monto en MXN por paciente.
    commissionValue: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 👈 Solo uno
  },
  { timestamps: true },
);

userSchema.index({ name: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🛡️ Este nombre debe coincidir EXACTO con el que usas en el controlador
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
