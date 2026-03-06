import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import connectDB from "../config/db.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Patient from "../models/clinical/Patient.js";

const seedCitasExistentes = async () => {
  try {
    await connectDB();
    console.log("✅ Conexión establecida.");

    // 1. Buscamos EXACTAMENTE a los usuarios que me pasaste por su correo
    const doctorAdmin = await User.findOne({ email: "dr@sbeltic.com" });
    const recepcionista = await User.findOne({ email: "ana@sbeltic.com" });

    if (!doctorAdmin || !recepcionista) {
      throw new Error(
        "❌ Aún no los encuentro. Revisa que estemos conectados a la misma base de datos del .env.",
      );
    }

    console.log(
      `👤 ¡Encontrados! Doctor: ${doctorAdmin.name} | Recepción: ${recepcionista.name}`,
    );

    // 2. Paciente de prueba
    let paciente = await Patient.findOne();
    if (!paciente) {
      paciente = await Patient.create({
        name: "María Pérez",
        phone: "555-123-4567",
        email: "maria@ejemplo.com",
      });
    }

    // 3. Crear 3 Citas para HOY
    const hoy = new Date();
    const citas = [
      {
        patientId: paciente._id,
        doctorId: doctorAdmin._id,
        roomId: "CONSULTORIO",
        appointmentDate: new Date(hoy).setHours(10, 0, 0, 0),
        duration: 45,
        status: "CONFIRMED",
        treatmentName: "Valoración Médica",
        originalQuote: 500,
        createdBy: recepcionista._id,
      },
      {
        patientId: paciente._id,
        doctorId: recepcionista._id,
        roomId: "CABINA_1",
        appointmentDate: new Date(hoy).setHours(12, 30, 0, 0),
        duration: 60,
        status: "PENDING",
        treatmentName: "Limpieza Facial Profunda",
        originalQuote: 800,
        createdBy: recepcionista._id,
      },
      {
        patientId: paciente._id,
        doctorId: doctorAdmin._id,
        roomId: "CONSULTORIO",
        appointmentDate: new Date(hoy).setHours(16, 0, 0, 0),
        duration: 30,
        status: "CONFIRMED",
        treatmentName: "Aplicación de Toxina",
        originalQuote: 3500,
        createdBy: doctorAdmin._id,
      },
    ];

    console.log("🧹 Limpiando citas de prueba anteriores...");
    await Appointment.deleteMany({});

    console.log("💾 Inyectando citas...");
    await Appointment.insertMany(citas);

    console.log(
      "🎉 ¡ÉXITO TOTAL! Las 3 citas se asignaron a Ana y al Dr. Admin.",
    );
    process.exit(0);
  } catch (error) {
    console.error("💥 Error crítico:", error.message);
    process.exit(1);
  }
};

seedCitasExistentes();
