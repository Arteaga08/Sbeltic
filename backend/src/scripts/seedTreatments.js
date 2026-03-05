import mongoose from "mongoose";
import dotenv from "dotenv";
import Treatment from "../models/clinical/Treatment.js";

// Cargar variables de entorno (Asegúrate de ejecutar el script desde la raíz donde está tu .env)
dotenv.config();

const treatmentsData = [
  // ==========================================
  // 👩‍⚕️ ÁREA DE RECEPCIÓN (performerRole: "RECEPTIONIST")
  // ==========================================

  // 1. Faciales y Cuidado de la Piel
  {
    name: "Foto rejuvenecimiento: Cara y escote",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Tratamiento para Manchas, secuelas y acné",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Bio estimulación con Dermapen",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Facial profundo con microdermoabrasión",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Facial profundo con hidrodermoabrasión",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Dermaplanning",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },
  {
    name: "Paquete Facial Mixto",
    performerRole: "RECEPTIONIST",
    category: "Faciales y Cuidado de la Piel",
  },

  // 2. Aparatología y Moldeo
  {
    name: "Radiofrecuencia",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },
  {
    name: "Tratamiento para Várices",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },
  {
    name: "Presoterapia",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },
  {
    name: "Cavitación",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },
  {
    name: "Masaje Relajante",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },
  {
    name: "Terapia Post-Quirúrgica",
    performerRole: "RECEPTIONIST",
    category: "Aparatología y Moldeo",
  },

  // 3. Depilación Láser Mujer
  {
    name: "Depilación Láser Mujer: Axilas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: Bikini",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: Bikini Brasileño",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: Bigote",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: 1/2 Brazos",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: 1/2 Piernas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Depilación Láser Mujer: Piernas completas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Paquete Depilación Mujer: Axilas, Bikini, Bigote",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Paquete Depilación Mujer: Axilas, Bikini, Bigote y 1/2 piernas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Paquete Depilación Mujer: Axilas, Bikini, bigote y piernas completas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },
  {
    name: "Paquete Depilación Mujer: Cuerpo completo sin restricciones",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Mujer",
  },

  // 4. Depilación Láser Hombre
  {
    name: "Depilación Láser Hombre: Pecho",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Abdomen",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Espalda",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Nuca",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Barba",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Delineado de Barba",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Hombro",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Cuerpo Completo",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: 1/2 cuerpo",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: 1/2 brazo",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Depilación Láser Hombre: Brazo completo",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Paquete Depilación Hombre: Barba, cuello, nuca y mejillas",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Paquete Depilación Hombre: Hombro, Espalda y 1/2 brazos",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },
  {
    name: "Paquete Depilación Hombre: Pecho, abdomen, espalda",
    performerRole: "RECEPTIONIST",
    category: "Depilación Láser Hombre",
  },

  // ==========================================
  // ⚕️ ÁREA MÉDICA (performerRole: "DOCTOR")
  // ==========================================

  // 5. Armonización Facial (Inyectables)
  {
    name: "Aplicación de Bótox",
    performerRole: "DOCTOR",
    category: "Armonización Facial",
  },
  {
    name: "Hilos PDO",
    performerRole: "DOCTOR",
    category: "Armonización Facial",
  },
  {
    name: "Ácido Hialurónico en labios",
    performerRole: "DOCTOR",
    category: "Armonización Facial",
  },

  // 6. Cirugía Facial
  { name: "Bichectomía", performerRole: "DOCTOR", category: "Cirugía Facial" },
  {
    name: "Blefaroplastia 4 párpados",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Blefaroplastia superior",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Blefaroplastia inferior",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Lipo de cuello",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Lipo de cuello y facial",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Lipo de cuello y bichectomía",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Lipo de cuello, facial y bichectomía",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Pexia de cejas (Brow lift)",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Pexia de labios (Lip lift)",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Ritidectomía facial 1/3 medio superior e inferior",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Ritidectomía facial y cuello",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  {
    name: "Mentoplastia facial y cuello",
    performerRole: "DOCTOR",
    category: "Cirugía Facial",
  },
  { name: "Otoplastia", performerRole: "DOCTOR", category: "Cirugía Facial" },

  // 7. Cirugía Corporal (Anestesia Local)
  {
    name: "Lipo área IMC <28 Sin injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },
  {
    name: "Lipo área IMC <28 Con injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },
  {
    name: "Lipo área IMC >28 <33 sin injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },
  {
    name: "Lipo área IMC >28 <33 con injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },
  {
    name: "Lipo área IMC >33 Sin injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },
  {
    name: "Lipo área IMC >33 Con injerto (Local)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal (Anestesia Local)",
  },

  // 8. Cirugía Corporal Mayor
  {
    name: "Abdominoplastia",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipoabdominoplastia",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipoescultura primaria 360 IMC <28 sin injerto",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipoescultura primaria 360 IMC <28 con injerto",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipoescultura primaria 360 IMC >28 <33 sin injerto",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipoescultura primaria 360 IMC >28 <33 con injerto",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Lipo 360 + implantes mamarios",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Mamoplastia de aumento",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Mastopexia / reducción mamaria sin implantes",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Mastopexia / reducción mamaria con implantes",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Mommy makeover 1 (Lipoabdomino + implantes o mastopexia sin implantes)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },
  {
    name: "Mommy makeover 2 (Lipoabdomino + mastopexia con implantes)",
    performerRole: "DOCTOR",
    category: "Cirugía Corporal Mayor",
  },

  // 9. Cirugía Íntima y Especialidades
  {
    name: "Labioplastia",
    performerRole: "DOCTOR",
    category: "Cirugía Íntima y Especialidades",
  },
  {
    name: "Peneplastia (AH o Nanofat)",
    performerRole: "DOCTOR",
    category: "Cirugía Íntima y Especialidades",
  },
  {
    name: "Cruroplastia",
    performerRole: "DOCTOR",
    category: "Cirugía Íntima y Especialidades",
  },
  {
    name: "Braquioplastia",
    performerRole: "DOCTOR",
    category: "Cirugía Íntima y Especialidades",
  },
  {
    name: "Injerto Capilar",
    performerRole: "DOCTOR",
    category: "Cirugía Íntima y Especialidades",
  },
];

const seedDB = async () => {
  try {
    // Conexión a tu nube usando la variable de entorno (compatibilidad MONGO_URI/MONGODB_URI)
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ No MONGO URI found in environment (MONGODB_URI or MONGO_URI)");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("☁️ Conectado a la Base de Datos en la Nube");

    // Opcional: Descomenta la siguiente línea si quieres borrar el catálogo anterior antes de inyectar este
    // await Treatment.deleteMany();
    // console.log("🗑️ Tratamientos anteriores eliminados");

    // Inyección de los datos reales
    await Treatment.insertMany(treatmentsData);
    console.log(
      `✅ ¡Éxito! Se han inyectado ${treatmentsData.length} tratamientos en la base de datos.`,
    );

    // Cierra el proceso limpiamente
    process.exit();
  } catch (error) {
    console.error("❌ Error al inyectar el catálogo:", error);
    process.exit(1);
  }
};

seedDB();
