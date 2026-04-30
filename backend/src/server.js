import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

// 🛠️ Configuraciones y Conexión

import connectDB from "./config/db.js";
import initCronJobs from "./jobs/cronJobs.js";
import corsOptions from "./config/corsOptions.js";
import { apiLimiter, publicLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import mongoSanitize from "./middlewares/mongoSanitize.js";

// 🛤️ Importación de Rutas
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";
import treatmentRoutes from "./routes/treatmentRoutes.js";
import treatmentCategoryRoutes from "./routes/treatmentCategoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import publicRoutes from "./routes/publicRoutes.js"; // 🌟 NUEVA: Rutas para firmas remotas
import medicalHistoryRoutes from "./routes/medicalHistoryRoutes.js"; // 📋 Historial médico vía WhatsApp
import webhookRoutes from "./routes/webhookRoutes.js"; // 🤖 Webhooks de WhatsApp
import templateRoutes from "./routes/templateRoutes.js"; // 📝💊 Plantillas de notas post-op y recetas

const app = express();
const PORT = process.env.PORT || 5009;
app.set('trust proxy', 1);
// ==========================================
// 1. MIDDLEWARES GLOBALES DE SEGURIDAD
// ==========================================
app.use(helmet());
app.use(cors(corsOptions));

// 🚀 CAMBIO CRÍTICO: Aumentamos el límite de 15kb a 10mb para recibir firmas Base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(mongoSanitize);

// Logger para desarrollo
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ==========================================
// 2. LIMITADOR DE TRÁFICO (Rate Limiting)
// ==========================================
app.use("/api", apiLimiter);

// ==========================================
// 3. RUTAS DE LA API (Endpoints)
// ==========================================

// Health Check
app.get("/health", (req, res) =>
  res.json({ status: "Sbeltic API Online", date: new Date() }),
);

// 🔓 RUTAS PÚBLICAS (Sin protección de token para pacientes)
// Rate limiting estricto: 10 req / 15 min por IP
app.use("/api/public", publicLimiter, publicRoutes);
app.use("/api/medical-history", publicLimiter, medicalHistoryRoutes);

// Módulo de Usuarios y Auth
app.use("/api/users", userRoutes);

// Módulo Clínico
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/treatment-categories", treatmentCategoryRoutes);
app.use("/api/templates", templateRoutes);

// Módulo de Logística (Inventario)
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/suppliers", supplierRoutes);

// Módulo de Marketing y Recompensas
app.use("/api/coupons", couponRoutes);

// 🤖 Webhooks (WhatsApp — sin auth, validado por HMAC)
app.use("/api/webhooks", webhookRoutes);

// 🛡️ Manejador de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: "fail",
    message: `La ruta ${req.originalUrl} no existe en este servidor Sbeltic`,
  });
});

// ==========================================
// 4. MANEJADOR DE ERRORES GLOBAL
// ==========================================
app.use(errorHandler);

// ==========================================
// 5. INICIALIZACIÓN DE SERVIDORES
// ==========================================
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Sbeltic Server running at http://localhost:${PORT}`);

      try {
        initCronJobs();
        console.log("⏱️ Cron jobs initialized successfully");
      } catch (err) {
        console.error("❌ Error initializing cron jobs:", err);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// ====== PROCESOS DE EMERGENCIA ======
// Para atrapar errores que no fueron capturados por try/catch
process.on("unhandledRejection", (err) => {
  console.log("💥 UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
