import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Estilos para el PDF (No usa Tailwind directamente, usa este objeto)
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#EEF2F6",
    pb: 10,
  },
  logoSection: { flexDirection: "column" },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4F46E5",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  row: { flexDirection: "row", gap: 20, marginBottom: 10 },
  field: { flexDirection: "column" },
  label: {
    fontSize: 7,
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: { fontSize: 10, color: "#1E293B", fontWeight: "medium" },

  content: { fontSize: 10, color: "#334155", lineHeight: 1.5 },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 40,
  },
  signatureBox: { alignItems: "center", width: 150 },
  signatureImg: {
    width: 120,
    height: 60,
    borderBottom: 1,
    borderBottomColor: "#CBD5E1",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#F1F5F9",
    pt: 10,
  },
  footerText: { fontSize: 8, color: "#94A3B8" },
});

const EvolutionPDF = ({ patient, evolution }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.title}>SBELTIC</Text>
          <Text style={styles.subtitle}>Medicina Estética & Salud</Text>
        </View>
        <View style={{ textAlign: "right" }}>
          <Text style={styles.subtitle}>Folio: {patient.referralCode}</Text>
          <Text style={styles.subtitle}>
            Fecha: {new Date(evolution.date || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* DATOS PACIENTE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Paciente</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{patient.name}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Edad</Text>
            <Text style={styles.value}>
              {patient.medicalHistory?.identification?.age || "---"} años
            </Text>
          </View>
        </View>
      </View>

      {/* SIGNOS VITALES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signos Vitales</Text>
        <View style={styles.row}>
          <Text style={styles.value}>
            TA: {evolution.vitals?.ta} | FC: {evolution.vitals?.fc} | Temp:{" "}
            {evolution.vitals?.temp}°C | IMC: {evolution.vitals?.imc}
          </Text>
        </View>
      </View>

      {/* DIAGNÓSTICO E INDICACIONES */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        <Text style={styles.content}>{evolution.diagnosis}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>
          Plan de Tratamiento / Indicaciones
        </Text>
        <Text style={styles.content}>{evolution.indications}</Text>
      </View>

      {/* FIRMAS */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          {evolution.doctorSignature && (
            <Image
              src={evolution.doctorSignature}
              style={styles.signatureImg}
            />
          )}
          <Text style={styles.label}>Firma del Médico</Text>
          <Text style={styles.value}>
            {evolution.doctorName || "Dr. Especialista"}
          </Text>
        </View>
        <View style={styles.signatureBox}>
          {evolution.patientSignature && (
            <Image
              src={evolution.patientSignature}
              style={styles.signatureImg}
            />
          )}
          <Text style={styles.label}>Firma del Paciente</Text>
          <Text style={styles.value}>{patient.name}</Text>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Este documento es un resumen clínico oficial generado por el sistema
          Sbeltic.
        </Text>
        <Text style={styles.footerText}>
          Durango, México - {new Date().getFullYear()}
        </Text>
      </View>
    </Page>
  </Document>
);

export default EvolutionPDF;
