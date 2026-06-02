import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

// 🛡️ Candado: este script SOLO debe correr en local/example, nunca en producción.
if (process.env.NODE_ENV === "production") {
  console.error("❌ Abortado: este script no puede ejecutarse en producción.");
  process.exit(1);
}

const EMAIL = "example@sbeltic.com";
const PASSWORD = "Example123";
const NAME = "Admin Example";

await mongoose.connect(process.env.MONGODB_URI);
console.log(`📂 Conectado a: ${mongoose.connection.host}/${mongoose.connection.name}`);

const existing = await User.findOne({ email: EMAIL }).select("+password");

if (existing) {
  existing.password = PASSWORD; // el hook pre("save") re-hashea
  existing.role = "ADMIN";
  existing.isActive = true;
  await existing.save();
  console.log(`♻️  Admin example actualizado: ${EMAIL} / ${PASSWORD}`);
} else {
  await User.create({
    name: NAME,
    email: EMAIL,
    password: PASSWORD, // el hook pre("save") lo hashea
    role: "ADMIN",
  });
  console.log(`✅ Admin example creado: ${EMAIL} / ${PASSWORD}`);
}

await mongoose.disconnect();
process.exit(0);
