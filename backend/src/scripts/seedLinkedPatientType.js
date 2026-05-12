/**
 * Asigna linkedPatientType a las TreatmentCategories existentes
 * basándose en palabras clave en su slug o nombre.
 *
 * Uso: node src/scripts/seedLinkedPatientType.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import TreatmentCategory from "../models/clinical/TreatmentCategory.js";

const MAPPINGS = [
  { keywords: ["CONSULT", "REVISION", "REVISIÓN", "EVALUAC", "CITA", "DIAGNOS"], type: "LEAD" },
  { keywords: ["INYECT", "BOTOX", "HARMONIZ", "ARMONIZ", "RELLEN", "TOXI"], type: "INJECTION" },
  { keywords: ["CIRUG", "SURG", "QUIROF", "OPERAC"], type: "SURGERY" },
  { keywords: ["POST", "POSTOP", "POST-OP", "RECUPER"], type: "POST_OP" },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Conectado a MongoDB");

  const categories = await TreatmentCategory.find({});
  console.log(`📋 Categorías encontradas: ${categories.length}`);

  let updated = 0;

  for (const cat of categories) {
    const searchStr = `${cat.slug} ${cat.name}`.toUpperCase();
    let matched = null;

    for (const { keywords, type } of MAPPINGS) {
      if (keywords.some((kw) => searchStr.includes(kw))) {
        matched = type;
        break;
      }
    }

    if (matched && cat.linkedPatientType !== matched) {
      await TreatmentCategory.findByIdAndUpdate(cat._id, { linkedPatientType: matched });
      console.log(`  ↳ "${cat.name}" (${cat.slug}) → ${matched}`);
      updated++;
    }
  }

  console.log(`\n✅ Categorías actualizadas: ${updated}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
