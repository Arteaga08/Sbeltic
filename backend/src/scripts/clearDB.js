import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearTestOnly = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🧹 Iniciando limpieza selectiva de Sbeltic...");

    // 📋 LISTA NEGRA: Solo estas colecciones se borran
    const toDelete = [
      "appointments",
      "patients",
      "waitlists",
      "batches",
      "products",
      "treatments",
      "coupons",
    ];

    for (const modelName of toDelete) {
      const collection = mongoose.connection.collections[modelName];
      if (collection) {
        await collection.deleteMany({});
        console.log(`✅ Colección [${modelName}] vaciada.`);
      }
    }

    console.log(
      "\n🚀 Staff (Admin/Recp) preservado. Datos de prueba eliminados.",
    );
    process.exit();
  } catch (err) {
    console.error("❌ Error en la limpieza:", err);
    process.exit(1);
  }
};

clearTestOnly();
