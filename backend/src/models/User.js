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
      enum: ["ADMIN", "RECEPTIONIST", "DOCTOR", "MARKETING"],
      default: "RECEPTIONIST",
    },
    phone: String,
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
