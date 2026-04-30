import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#EEF2F6",
    paddingBottom: 12,
  },
  logoSection: { flexDirection: "column" },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B", marginBottom: 4 },
  subtitle: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  section: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4F46E5",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  row: { flexDirection: "row", gap: 20, marginBottom: 6 },
  field: { flexDirection: "column" },
  label: {
    fontSize: 7,
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: { fontSize: 10, color: "#1E293B" },

  // Tabla de medicamentos
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    padding: "6 8",
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableCell: { fontSize: 9, color: "#334155" },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Anchos de columnas (6 columnas de tabla)
  colName: { flex: 2 },
  colPresentation: { flex: 1.5 },
  colDose: { flex: 1 },
  colRoute: { flex: 0.8 },
  colFreq: { flex: 1.2 },
  colDur: { flex: 1 },

  content: { fontSize: 10, color: "#334155", lineHeight: 1.5 },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 40,
  },
  signatureBox: { alignItems: "center", width: 180 },
  signatureLine: {
    width: 160,
    borderBottom: 1,
    borderBottomColor: "#CBD5E1",
    marginBottom: 5,
    height: 50,
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#94A3B8" },
});

const PrescriptionPDF = ({ patient, prescription }) => {
  const date = new Date(prescription.createdAt || Date.now());

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.title}>SBELTIC</Text>
            <Text style={styles.subtitle}>Medicina Estética & Salud</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.subtitle}>Receta Médica</Text>
            <Text style={[styles.subtitle, { marginTop: 4 }]}>
              Folio: {patient.referralCode || "---"}
            </Text>
            <Text style={[styles.subtitle, { marginTop: 2 }]}>
              Fecha: {date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* DATOS DEL PACIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Nombre completo</Text>
              <Text style={styles.value}>{patient.name}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Edad</Text>
              <Text style={styles.value}>
                {patient.medicalHistory?.identification?.age || "---"} años
              </Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{patient.phone || "---"}</Text>
            </View>
          </View>
          {prescription.title && (
            <View style={styles.field}>
              <Text style={styles.label}>Procedimiento / Diagnóstico</Text>
              <Text style={styles.value}>{prescription.title}</Text>
            </View>
          )}
        </View>

        {/* TABLA DE MEDICAMENTOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos Prescritos</Text>

          {/* Header tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colName]}>Medicamento</Text>
            <Text style={[styles.tableHeaderCell, styles.colPresentation]}>Presentación</Text>
            <Text style={[styles.tableHeaderCell, styles.colDose]}>Dosis</Text>
            <Text style={[styles.tableHeaderCell, styles.colRoute]}>Vía</Text>
            <Text style={[styles.tableHeaderCell, styles.colFreq]}>Frecuencia</Text>
            <Text style={[styles.tableHeaderCell, styles.colDur]}>Duración</Text>
          </View>

          {prescription.medications?.map((med, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colName]}>{med.name || "---"}</Text>
              <Text style={[styles.tableCell, styles.colPresentation]}>{med.presentation || "---"}</Text>
              <Text style={[styles.tableCell, styles.colDose]}>{med.dose || "---"}</Text>
              <Text style={[styles.tableCell, styles.colRoute]}>{med.route || "---"}</Text>
              <Text style={[styles.tableCell, styles.colFreq]}>{med.frequency || "---"}</Text>
              <Text style={[styles.tableCell, styles.colDur]}>{med.duration || "---"}</Text>
            </View>
          ))}
        </View>

        {/* INDICACIONES GENERALES */}
        {prescription.generalIndications ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Indicaciones Generales</Text>
            <Text style={styles.content}>{prescription.generalIndications}</Text>
          </View>
        ) : null}

        {/* FIRMA DEL MÉDICO */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.label}>Firma del Médico</Text>
            <Text style={[styles.value, { fontSize: 9, marginTop: 4 }]}>
              {prescription.doctorName || "Dr. Especialista"}
            </Text>
            {prescription.doctorLicense ? (
              <Text style={[styles.label, { marginTop: 2 }]}>
                Céd. Prof. {prescription.doctorLicense}
              </Text>
            ) : null}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Receta médica oficial generada por el sistema Sbeltic — Durango, México.
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            Válida únicamente con firma y sello del médico responsable.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PrescriptionPDF;
