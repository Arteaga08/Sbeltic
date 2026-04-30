import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import Patient from "../models/clinical/Patient.js";
import User from "../models/User.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(str) {
  // Split by spaces to handle Spanish special chars (ñ, á, é, etc.)
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

function parseDate(str) {
  if (!str) return null;
  const clean = str.trim();
  // DD/MM/YYYY
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00Z`);
  return isNaN(date.getTime()) ? null : date;
}

function cleanPhone(str) {
  if (!str) return null;
  return str.replace(/[^\d+]/g, "").trim() || null;
}

function labelValue($, container, labelText) {
  let found = null;
  $(container)
    .find("label")
    .each((_, el) => {
      if ($(el).text().trim().toLowerCase().includes(labelText.toLowerCase())) {
        found = $(el).next("span").text().trim();
      }
    });
  return found || null;
}

// Eleonor has typos: "Antecendes" instead of "Antecedentes"
// Uses regex patterns to match section headers regardless of typos
function sectionText($, pattern) {
  let result = "";
  $("h4").each((_, el) => {
    if (pattern.test($(el).text())) {
      const ul = $(el).next("ul");
      if (ul.length) result = ul.text().replace(/\s+/g, " ").trim();
    }
  });
  return result;
}

// ─── Parser principal ────────────────────────────────────────────────────────

function parsePatientHTML(html) {
  const $ = cheerio.load(html);

  // Nombre
  const rawName = $("h2.ui.medium.header span").first().text().trim();
  const name = rawName ? toTitleCase(rawName) : null;

  // Datos generales: buscar en todas las filas div-table
  let phone = null;
  let email = null;
  let dateOfBirth = null;
  let gender = null;
  let address = null;
  let maritalStatus = null;
  let occupation = null;

  $(".div-table-row, .div-table-col").each((_, row) => {
    const text = $(row).text();
    if (/Celular/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !phone) phone = cleanPhone(span);
    }
    if (/Correo/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !email) email = span.toLowerCase();
    }
    if (/Fecha de nacimiento/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !dateOfBirth) dateOfBirth = parseDate(span);
    }
    if (/Género/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !gender) gender = span;
    }
    if (/Dirección/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !address) address = span;
    }
    if (/Estado Civil/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !maritalStatus) maritalStatus = span;
    }
    if (/Ocupaci/i.test(text)) {
      const span = $(row).find("span").last().text().trim();
      if (span && !occupation) occupation = span;
    }
  });

  // Motivo de consulta (ficha general)
  let consultationReason = null;
  $("h4").each((_, el) => {
    if (/Motivo de la Consulta/i.test($(el).text())) {
      consultationReason = $(el).next("div").find("pre").text().trim() || null;
    }
  });

  // Historia clínica
  const medicalHistory = {
    identification: {
      gender,
      address,
      maritalStatus,
      occupation,
    },
    // Eleonor typo: "Antecendes" (missing 'nt') — patterns cover both spellings
    pathological: { raw: sectionText($, /Antecen\w*\s+Patológicos/i) },
    habits: { raw: sectionText($, /Antecen\w*\s+NO\s+Patológicos/i) },
    family: { raw: sectionText($, /Antecen\w*\s+Familiares/i) },
    gyneco: { raw: sectionText($, /Ginecológ/i) },
    systems: { raw: sectionText($, /Aparatos y Sistemas/i) },
    allergies: {},
    vital: {},
    comorbidities: {},
    currentCondition: {},
  };

  const hasMedicalHistory = Object.values(medicalHistory).some((v) => {
    if (typeof v === "object") return Object.values(v).some((x) => x);
    return !!v;
  });

  // Consultas → evolutions
  const evolutions = [];
  $("div[id^='cons_']").each((_, consEl) => {
    const cons = $(consEl);

    let consultDate = null;
    cons.find(".titulosConsulta, span.titulosConsulta").each((_, el) => {
      const t = $(el).text();
      if (/Fecha de la consulta/i.test(t)) {
        consultDate = parseDate($(el).next("span").text().trim());
      }
    });

    // Texto de padecimiento y exploración física
    let currentConditionText = "";
    let physicalExamText = "";
    cons.find(".div-table-colum, .div-table-col").each((_, col) => {
      const titleEl = $(col).find(".titulosConsulta").first();
      const title = titleEl.text().trim();
      const valueSpan = titleEl.nextAll("span").first().text().trim();

      if (/Padecimiento Actual/i.test(title)) currentConditionText = valueSpan;
      if (/Exploración Física/i.test(title)) physicalExamText = valueSpan;
    });

    // Signos vitales
    const vitals = {};
    cons.find("label.theader.msure, label.msure").each((_, label) => {
      const nameAttr = $(label).attr("name");
      const val = $(label).find("div span").first().text().trim();
      if (!nameAttr || !val) return;
      const map = {
        stature: "altura",
        weight: "peso",
        bloodPressure: "TA",
        temp: "TEMP",
        heartRate: "FC",
        breathingFrequency: "FR",
        bloodOxygenation: "O2",
        bodyMassIndex: "IMC",
      };
      if (map[nameAttr]) vitals[map[nameAttr]] = val;
    });

    // Resultados de laboratorio
    let labResults = "";
    cons.find(".div-table-colum, .div-table-col").each((_, col) => {
      if (/Resultados de estudios/i.test($(col).text())) {
        labResults = $(col).find("span").last().text().trim();
      }
    });

    // Diagnósticos
    let diagnosisText = "";
    cons.find(".ui.secondary.segment").each((_, seg) => {
      if (/Diagnósticos/i.test($(seg).find("h4").first().text())) {
        diagnosisText = $(seg).find("p").map((_, p) => $(p).text().trim()).get().join("\n");
      }
    });

    // Medicamentos
    let medicationsText = "";
    cons.find(".ui.secondary.segment").each((_, seg) => {
      if (/Medicamento/i.test($(seg).find("h4").first().text())) {
        medicationsText = $(seg).text().replace(/Medicamento/i, "").replace(/\s+/g, " ").trim();
      }
    });

    // Estudios requeridos
    let studiesText = "";
    cons.find(".lab-studies ol li").each((_, li) => {
      studiesText += `- ${$(li).text().trim()}\n`;
    });

    const indications = [medicationsText, studiesText].filter(Boolean).join("\n\n");

    evolutions.push({
      vitals,
      physicalExam: { exploracion: physicalExamText },
      labResults,
      diagnosis: diagnosisText,
      indications,
      createdAt: consultDate || new Date(),
    });
  });

  // Cirugías → postOpNotes
  const postOpNotes = [];
  let hasSurgeries = false;

  $(".ui.segments").each((_, seg) => {
    const block = $(seg);
    if (!/Cirugía|Procedimiento/i.test(block.text())) return;
    hasSurgeries = true;

    let surgeryDate = null;
    block.find("span").each((_, el) => {
      const parent = $(el).parent().text();
      if (/Fecha de cirugía/i.test(parent)) {
        surgeryDate = parseDate($(el).text().trim());
      }
    });

    const title = `Nota Post-quirúrgica${surgeryDate ? ` - ${surgeryDate.toLocaleDateString("es-MX")}` : ""}`;
    const body = block.text().replace(/\s+/g, " ").trim();

    postOpNotes.push({ title, body, createdAt: surgeryDate || new Date() });
  });

  // patientType
  const patientType = hasSurgeries ? "SURGERY" : "OTHER";

  return {
    name,
    phone,
    email,
    dateOfBirth,
    patientType,
    medicalHistory: hasMedicalHistory ? medicalHistory : null,
    evolutions,
    postOpNotes,
    consultationReason,
  };
}

// ─── Script principal ─────────────────────────────────────────────────────────

const { MONGODB_URI } = process.env;

const backupFolder = process.argv[2];
if (!backupFolder) {
  console.error("❌ Uso: node migrateEleonor.js <ruta-carpeta-respaldo>");
  process.exit(1);
}

if (!fs.existsSync(backupFolder)) {
  console.error("❌ La carpeta no existe:", backupFolder);
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log("✅ Conectado a MongoDB");

const adminUser = await User.findOne({ role: "ADMIN" });
if (!adminUser) {
  console.error("❌ No se encontró ningún usuario con role ADMIN en la BD");
  await mongoose.disconnect();
  process.exit(1);
}
const adminId = adminUser._id;

const files = fs.readdirSync(backupFolder).filter((f) => f.endsWith(".html"));
console.log(`📂 ${files.length} archivos HTML encontrados\n`);

let created = 0;
let updated = 0;
let skipped = 0;
let errors = 0;

for (const file of files) {
  const filePath = path.join(backupFolder, file);
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    const data = parsePatientHTML(html);

    if (!data.name || !data.phone) {
      console.warn(`⚠️  ${file}: sin nombre o teléfono — omitido`);
      skipped++;
      continue;
    }

    const existing = await Patient.findOne({ phone: data.phone });

    if (!existing) {
      // Crear paciente nuevo
      const newPatient = {
        name: data.name,
        phone: data.phone,
        patientType: data.patientType,
        isProfileComplete: false,
        createdBy: adminId,
      };

      if (data.email) newPatient.email = data.email;
      if (data.dateOfBirth) newPatient.dateOfBirth = data.dateOfBirth;
      if (data.medicalHistory) newPatient.medicalHistory = data.medicalHistory;

      if (data.evolutions.length > 0) {
        newPatient.evolutions = data.evolutions.map((e) => ({ ...e, createdBy: adminId }));
      }

      if (data.postOpNotes.length > 0) {
        newPatient.postOpNotes = data.postOpNotes.map((n) => ({
          ...n,
          createdBy: adminId,
        }));
      }

      if (data.consultationReason) {
        newPatient.clinicalNotes = [
          {
            note: `[Eleonor] Motivo de consulta: ${data.consultationReason}`,
            createdBy: adminId,
            createdAt: new Date(),
          },
        ];
      }

      await Patient.create(newPatient);
      console.log(`✅ CREADO: ${data.name} (${data.phone})`);
      created++;
    } else {
      // Actualizar datos faltantes
      let modified = false;

      // medicalHistory vacío → agregar
      const mhEmpty = !existing.medicalHistory ||
        Object.values(existing.medicalHistory).every(
          (v) => !v || (typeof v === "object" && Object.keys(v).length === 0)
        );
      if (mhEmpty && data.medicalHistory) {
        existing.medicalHistory = data.medicalHistory;
        modified = true;
      }

      // email faltante
      if (!existing.email && data.email) {
        existing.email = data.email;
        modified = true;
      }

      // dateOfBirth faltante
      if (!existing.dateOfBirth && data.dateOfBirth) {
        existing.dateOfBirth = data.dateOfBirth;
        modified = true;
      }

      // Agregar evolutions nuevas (evitar duplicados por fecha)
      if (data.evolutions.length > 0) {
        const existingDates = new Set(
          (existing.evolutions || []).map((e) => e.createdAt?.toISOString().split("T")[0])
        );
        const newEvos = data.evolutions
          .filter((e) => {
            const d = e.createdAt instanceof Date ? e.createdAt.toISOString().split("T")[0] : null;
            return d && !existingDates.has(d);
          })
          .map((e) => ({ ...e, createdBy: adminId }));

        if (newEvos.length > 0) {
          existing.evolutions = [...(existing.evolutions || []), ...newEvos];
          modified = true;
        }
      }

      // Agregar postOpNotes nuevas
      if (data.postOpNotes.length > 0) {
        const existingTitles = new Set((existing.postOpNotes || []).map((n) => n.title));
        const newNotes = data.postOpNotes
          .filter((n) => !existingTitles.has(n.title))
          .map((n) => ({ ...n, createdBy: adminId }));

        if (newNotes.length > 0) {
          existing.postOpNotes = [...(existing.postOpNotes || []), ...newNotes];
          modified = true;
        }
      }

      // Nota de motivo de consulta
      if (data.consultationReason) {
        const alreadyHasNote = (existing.clinicalNotes || []).some((n) =>
          n.note?.startsWith("[Eleonor]")
        );
        if (!alreadyHasNote) {
          existing.clinicalNotes = [
            ...(existing.clinicalNotes || []),
            {
              note: `[Eleonor] Motivo de consulta: ${data.consultationReason}`,
              createdBy: adminId,
              createdAt: new Date(),
            },
          ];
          modified = true;
        }
      }

      if (modified) {
        await existing.save();
        console.log(`🔄 ACTUALIZADO: ${existing.name} (${data.phone})`);
        updated++;
      } else {
        console.log(`➡️  SIN CAMBIOS: ${existing.name} (${data.phone})`);
        skipped++;
      }
    }
  } catch (err) {
    console.error(`❌ ERROR en ${file}:`, err.message);
    errors++;
  }
}

console.log(`
─────────────────────────────
✅ Creados:     ${created}
🔄 Actualizados: ${updated}
➡️  Sin cambios: ${skipped}
❌ Errores:     ${errors}
─────────────────────────────
Total procesados: ${files.length}
`);

await mongoose.disconnect();
