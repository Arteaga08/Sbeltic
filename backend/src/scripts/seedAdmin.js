import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Debes definir ADMIN_EMAIL y ADMIN_PASSWORD en el .env");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const exists = await User.findOne({ email: ADMIN_EMAIL });
if (exists) {
  console.log("⚠️  El admin ya existe:", ADMIN_EMAIL);
  process.exit(0);
}

await User.create({
  name: ADMIN_NAME || "Administrador",
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  role: "ADMIN",
});

console.log("✅ Admin creado:", ADMIN_EMAIL);
await mongoose.disconnect();
