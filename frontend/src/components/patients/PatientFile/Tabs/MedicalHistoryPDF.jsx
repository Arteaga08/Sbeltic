import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#FFFFFF", fontFamily: "Helvetica", fontSize: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: 1,
    borderBottomColor: "#E2E8F0",
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  brandSub: { fontSize: 8, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  metaText: { fontSize: 8, color: "#64748B", textAlign: "right" },

  section: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 6 },
  field: { flexDirection: "column", minWidth: 120 },
  label: { fontSize: 7, color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 9, color: "#1E293B" },
  textBlock: { fontSize: 9, color: "#334155", lineHeight: 1.5 },

  boolRow: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  boolLabel: { fontSize: 9, color: "#1E293B", fontWeight: "bold", width: 160 },
  boolYes: { fontSize: 9, color: "#059669", fontWeight: "bold", width: 30 },
  boolNo: { fontSize: 9, color: "#64748B", width: 30 },
  boolDetail: { fontSize: 8, color: "#475569", flex: 1 },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signatureBox: { alignItems: "center" },
  signatureImg: {
    width: 160,
    height: 70,
    borderBottom: 1,
    borderBottomColor: "#CBD5E1",
    marginBottom: 5,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#94A3B8" },
  pageNumber: { fontSize: 7, color: "#94A3B8", textAlign: "right" },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const val = (v, fallback = "---") =>
  v !== undefined && v !== null && v !== "" ? String(v) : fallback;

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{val(value)}</Text>
  </View>
);

const BoolRow = ({ label, has, detail }) => (
  <View style={styles.boolRow}>
    <Text style={styles.boolLabel}>{label}</Text>
    <Text style={has ? styles.boolYes : styles.boolNo}>{has ? "Sí" : "No"}</Text>
    {has && detail ? <Text style={styles.boolDetail}>{detail}</Text> : null}
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const PATIENT_TYPE_LABELS = {
  SPA: "Spa",
  INJECTION: "Inyectables",
  SURGERY: "Cirugía",
  POST_OP: "Post-Op",
  LEAD: "Seguimiento",
  OTHER: "Otro",
};

const SYSTEMS = [
  { id: "heart", label: "Corazón" },
  { id: "circulation", label: "Circulación Sanguínea" },
  { id: "coagulation", label: "Coagulación de Sangre" },
  { id: "respiratory", label: "Pulmones / Respiración" },
  { id: "gastrointestinal", label: "Gastrointestinales" },
  { id: "urinary", label: "Vías Urinarias" },
  { id: "hormonal", label: "Sistema Hormonal" },
  { id: "skin", label: "Piel" },
  { id: "nervous", label: "Sistema Nervioso" },
];

const FAMILY_CONDITIONS = [
  { id: "hypertension", label: "Hipertensión Arterial" },
  { id: "diabetes", label: "Diabetes Mellitus" },
  { id: "thrombosis", label: "Trombosis" },
  { id: "bleeding", label: "Sangrados Exagerados" },
  { id: "cancer", label: "Cáncer" },
];

// ── Main Component ────────────────────────────────────────────────────────────

const MedicalHistoryPDF = ({ patient }) => {
  const mh = patient?.medicalHistory || {};
  const id = mh.identification || {};
  const vital = mh.vital || {};
  const allergies = mh.allergies || {};
  const comorbidities = mh.comorbidities || {};
  const family = mh.family || {};
  const gyneco = mh.gyneco || {};
  const systems = mh.systems || {};
  const pathological = mh.pathological || {};
  const habits = mh.habits || {};

  const currentCondition =
    typeof mh.currentCondition === "object"
      ? mh.currentCondition?.reason || ""
      : mh.currentCondition || "";

  // Check if gyneco section has any data
  const hasGynecoData =
    gyneco.menarcheAge ||
    gyneco.pregnancies ||
    gyneco.naturalBirths ||
    gyneco.cSections ||
    gyneco.contraceptiveMethod ||
    gyneco.lastMenstruationDate;

  const hasFamilyData = FAMILY_CONDITIONS.some((c) => family[c.id]?.has !== undefined);
  const hasSystemsData = SYSTEMS.some((s) => systems[s.id]?.hasIssue !== undefined);

  const genDate = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page
        size="LETTER"
        style={styles.page}
        wrap
      >
        {/* HEADER */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>SBELTIC</Text>
            <Text style={styles.brandSub}>Medicina Estética & Salud</Text>
          </View>
          <View>
            <Text style={styles.metaText}>Historial Médico Completo</Text>
            <Text style={styles.metaText}>Folio: {val(patient?.referralCode)}</Text>
            <Text style={styles.metaText}>Generado: {genDate}</Text>
          </View>
        </View>

        {/* DATOS DEL PACIENTE */}
        <Section title="Datos del Paciente">
          <View style={styles.row}>
            <Field label="Nombre" value={patient?.name} />
            <Field label="Teléfono" value={patient?.phone} />
            <Field label="Correo" value={patient?.email} />
            <Field label="Categoría" value={PATIENT_TYPE_LABELS[patient?.patientType] || patient?.patientType} />
          </View>
        </Section>

        {/* IDENTIFICACIÓN */}
        <Section title="Identificación">
          <View style={styles.row}>
            <Field label="Edad" value={id.age ? `${id.age} años` : undefined} />
            <Field label="Fecha de Nacimiento" value={id.birthday} />
            <Field label="Tipo de Sangre" value={vital.bloodType} />
          </View>
          <View style={styles.row}>
            <Field label="Escolaridad" value={id.educationLevel} />
            <Field label="Religión" value={id.religion} />
          </View>
          {id.address ? (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{id.address}</Text>
            </View>
          ) : null}
        </Section>

        {/* ALERGIAS */}
        <Section title="Alergias">
          <BoolRow
            label="Alimentos"
            has={allergies.food?.has}
            detail={allergies.food?.detail}
          />
          <BoolRow
            label="Medicamentos"
            has={allergies.medications?.has}
            detail={allergies.medications?.detail}
          />
          <BoolRow
            label="Otras alergias"
            has={allergies.others?.has}
            detail={allergies.others?.detail}
          />
        </Section>

        {/* COMORBILIDADES */}
        <Section title="Enfermedades y Comorbilidades">
          <BoolRow label="¿Tiene alguna enfermedad?" has={comorbidities.hasDisease} />
          {comorbidities.hasDisease && (
            <View style={{ marginTop: 4, marginLeft: 8 }}>
              {comorbidities.diseases?.hypertension && <Text style={styles.value}>• Hipertensión Arterial</Text>}
              {comorbidities.diseases?.diabetes && <Text style={styles.value}>• Diabetes Mellitus</Text>}
              {comorbidities.diseases?.thyroid && <Text style={styles.value}>• Prob. Tiroides</Text>}
              {comorbidities.diseases?.kidney && <Text style={styles.value}>• Prob. Riñones</Text>}
              {comorbidities.diseases?.liver && <Text style={styles.value}>• Prob. Hígado</Text>}
              {comorbidities.diseases?.others && (
                <Text style={styles.value}>• Otra: {comorbidities.diseases.others}</Text>
              )}
            </View>
          )}
          {comorbidities.currentMedications && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Medicamentos actuales</Text>
              <Text style={styles.value}>{comorbidities.currentMedications}</Text>
            </View>
          )}
        </Section>

        {/* ANTECEDENTES FAMILIARES */}
        {hasFamilyData && (
          <Section title="Antecedentes Familiares">
            {FAMILY_CONDITIONS.map(({ id: cId, label }) => {
              const entry = family[cId];
              if (!entry) return null;
              const detail = [entry.who, entry.type].filter(Boolean).join(" — ");
              return (
                <BoolRow
                  key={cId}
                  label={label}
                  has={entry.has === true || entry.has === "SI"}
                  detail={detail || undefined}
                />
              );
            })}
          </Section>
        )}

        {/* ANTECEDENTES PATOLÓGICOS */}
        <Section title="Antecedentes Patológicos">
          {/* Cirugías */}
          <BoolRow
            label="Cirugías previas"
            has={pathological.surgeries?.has}
            detail={pathological.surgeries?.detail}
          />
          {pathological.surgeries?.complications && (
            <View style={{ marginLeft: 190, marginBottom: 4 }}>
              <Text style={styles.label}>Complicaciones</Text>
              <Text style={styles.value}>{pathological.surgeries.complications}</Text>
            </View>
          )}

          {/* Hospitalizaciones */}
          <BoolRow
            label="Hospitalizaciones"
            has={pathological.hospitalized?.has}
            detail={pathological.hospitalized?.reason}
          />

          {/* Accidentes */}
          <BoolRow
            label="Accidentes con secuelas"
            has={pathological.accidents?.has}
            detail={pathological.accidents?.detail}
          />

          {/* Malformaciones */}
          <BoolRow
            label="Malformaciones"
            has={pathological.malformations?.has}
            detail={pathological.malformations?.detail}
          />

          {/* Transfusiones */}
          <BoolRow
            label="Transfusiones de sangre"
            has={pathological.transfusions?.has}
            detail={pathological.transfusions?.reaction}
          />

          {/* COVID */}
          <BoolRow
            label="COVID-19"
            has={pathological.covid?.had}
          />
          {pathological.covid?.had && (
            <View style={{ marginLeft: 8, marginBottom: 4 }}>
              {pathological.covid.date && <Text style={styles.value}>Fecha: {pathological.covid.date}</Text>}
              {pathological.covid.sequels && <Text style={styles.value}>Secuelas: {pathological.covid.sequels}</Text>}
              <Text style={styles.value}>
                Vacuna: {pathological.covid.vaccine ? `Sí (${val(pathological.covid.type)})` : "No"}
              </Text>
            </View>
          )}
        </Section>

        {/* HÁBITOS */}
        <Section title="Hábitos">
          <BoolRow
            label="Tabaco"
            has={habits.tobacco?.does}
            detail={habits.tobacco?.does ? `Frecuencia: ${val(habits.tobacco.frequency)}` : undefined}
          />
          <BoolRow
            label="Alcohol"
            has={habits.alcohol?.does}
            detail={habits.alcohol?.does ? `Frecuencia: ${val(habits.alcohol.frequency)}` : undefined}
          />
          <BoolRow
            label="Drogas"
            has={habits.drugs?.does}
            detail={
              habits.drugs?.does
                ? [
                    habits.drugs.types?.marijuana && "Mariguana",
                    habits.drugs.types?.cocaine && "Cocaína",
                    habits.drugs.types?.crystal && "Cristal",
                    habits.drugs.types?.other,
                  ]
                    .filter(Boolean)
                    .join(", ") || undefined
                : undefined
            }
          />
          <BoolRow
            label="Ejercicio"
            has={habits.exercise?.does}
            detail={habits.exercise?.does ? val(habits.exercise.type) : undefined}
          />
          <BoolRow
            label="Suplementos / Medicamentos"
            has={habits.supplements?.does}
            detail={habits.supplements?.does ? val(habits.supplements.detail) : undefined}
          />
          {habits.previousTreatments && Object.values(habits.previousTreatments).some(Boolean) && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Tratamientos estéticos previos</Text>
              <Text style={styles.value}>
                {[
                  habits.previousTreatments.massages && "Masajes",
                  habits.previousTreatments.mesotherapy && "Mesoterapia",
                  habits.previousTreatments.cavitation && "Cavitación",
                  habits.previousTreatments.hydrolipoclasy && "Hidrolipoclasia",
                  habits.previousTreatments.cryolipolysis && "Criolipólisis",
                  habits.previousTreatments.radiofrequency && "Radiofrecuencia",
                  habits.previousTreatments.fillers && "Rellenos",
                ]
                  .filter(Boolean)
                  .join(", ") || "---"}
              </Text>
            </View>
          )}
        </Section>

        {/* INTERROGATORIO POR SISTEMAS */}
        {hasSystemsData && (
          <Section title="Interrogatorio por Aparatos y Sistemas">
            {SYSTEMS.map(({ id: sId, label }) => {
              const entry = systems[sId];
              if (!entry) return null;
              return (
                <BoolRow
                  key={sId}
                  label={label}
                  has={entry.hasIssue}
                  detail={entry.hasIssue ? entry.detail : undefined}
                />
              );
            })}
          </Section>
        )}

        {/* ANTECEDENTES GINECO-OBSTÉTRICOS */}
        {hasGynecoData && (
          <Section title="Antecedentes Gineco-Obstétricos">
            <View style={styles.row}>
              <Field label="Menarca (1ra Regla)" value={gyneco.menarcheAge ? `${gyneco.menarcheAge} años` : undefined} />
              <Field label="Embarazos" value={gyneco.pregnancies} />
              <Field label="Partos Naturales" value={gyneco.naturalBirths} />
              <Field label="Cesáreas" value={gyneco.cSections} />
              <Field label="Abortos" value={gyneco.abortions} />
            </View>
            <View style={styles.row}>
              <Field label="Últ. Parto" value={gyneco.lastBirthDate} />
              <Field label="Últ. Cesárea" value={gyneco.lastCSectionDate} />
              <Field label="Últ. Aborto" value={gyneco.lastAbortionDate} />
            </View>
            <View style={styles.row}>
              <Field label="Inicio Últ. Menstruación" value={gyneco.lastMenstruationDate} />
              <Field label="Ciclo cada (días)" value={gyneco.cycleDurationDays} />
              <Field label="Duración sangrado (días)" value={gyneco.bleedingDays} />
              <Field label="¿Periodo irregular?" value={gyneco.isIrregular ? "Sí" : "No"} />
            </View>
            <View style={{ marginTop: 4 }}>
              <Field label="Método Anticonceptivo" value={gyneco.contraceptiveMethod === "OTRO" ? gyneco.otherContraceptive : gyneco.contraceptiveMethod} />
            </View>
            {gyneco.hasComplications && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>Complicaciones obstétricas</Text>
                <Text style={styles.value}>{val(gyneco.complicationsDetail)}</Text>
              </View>
            )}
          </Section>
        )}

        {/* PADECIMIENTO ACTUAL */}
        {currentCondition ? (
          <Section title="Padecimiento Actual / Motivo de Visita">
            <Text style={styles.textBlock}>{currentCondition}</Text>
          </Section>
        ) : null}

        {/* FIRMA DEL PACIENTE */}
        {patient?.historySignature && (
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Image src={patient.historySignature} style={styles.signatureImg} />
              <Text style={styles.label}>Firma del Paciente</Text>
              <Text style={styles.value}>{patient.name}</Text>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento oficial generado por el sistema Sbeltic — Durango, México
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export default MedicalHistoryPDF;
