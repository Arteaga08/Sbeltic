import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

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
  subtitle: { fontSize: 8, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
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
    color: "#14B8A6",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 24, marginBottom: 4 },
  field: { flexDirection: "column", flex: 1 },
  label: { fontSize: 7, color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 10, color: "#1E293B" },
  supplyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: 1,
    borderBottomColor: "#E2E8F0",
  },
  finRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: "#CBD5E1",
  },
  totalLabel: { fontSize: 11, fontWeight: "bold", color: "#0F172A" },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#14B8A6" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: "#94A3B8" },
});

export default function AppointmentPDF({ appointment, form }) {
  const patient = appointment.patientId || {};
  const doctor = appointment.doctorId || {};
  const apptDate = new Date(appointment.appointmentDate).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const apptTime = new Date(appointment.appointmentDate).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const supplies = form?.consumedSupplies || appointment.consumedSupplies || [];
  const originalQuote = form?.originalQuote ?? appointment.originalQuote ?? 0;
  const discountApplied = appointment.discountApplied ?? 0;
  const finalAmount = appointment.finalAmount ?? Math.max(0, originalQuote - discountApplied);
  const status = form?.status || appointment.status;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SBELTIC</Text>
            <Text style={styles.subtitle}>Medicina Estética & Salud</Text>
          </View>
          <View>
            <Text style={styles.metaText}>Registro de Cita</Text>
            <Text style={styles.metaText}>
              Generado: {new Date().toLocaleDateString("es-MX")}
            </Text>
          </View>
        </View>

        {/* PACIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Paciente</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{patient.name || "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{patient.phone || "—"}</Text>
            </View>
          </View>
        </View>

        {/* CITA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de la Cita</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>{apptDate}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Hora</Text>
              <Text style={styles.value}>{apptTime}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Tratamiento</Text>
              <Text style={styles.value}>{appointment.treatmentName || "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.value}>{doctor.name || "—"}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Cabina</Text>
              <Text style={styles.value}>{appointment.roomId?.replace("_", " ") || "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Estado</Text>
              <Text style={styles.value}>{STATUS_LABELS[status] || status}</Text>
            </View>
          </View>
        </View>

        {/* NOTAS */}
        {(form?.consultationRecord?.reasonForVisit || appointment.consultationRecord?.reasonForVisit) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas de Consulta</Text>
            <Text style={{ fontSize: 10, color: "#334155", lineHeight: 1.5 }}>
              {form?.consultationRecord?.reasonForVisit || appointment.consultationRecord?.reasonForVisit}
            </Text>
          </View>
        )}

        {/* INSUMOS */}
        {supplies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insumos Utilizados</Text>
            {supplies.map((s, i) => (
              <View key={i} style={styles.supplyRow}>
                <Text style={{ fontSize: 10, color: "#1E293B" }}>
                  {s.productName || s.productId}
                </Text>
                <Text style={{ fontSize: 10, color: "#64748B" }}>x{s.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* FINANZAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          <View style={styles.finRow}>
            <Text style={{ fontSize: 10, color: "#64748B" }}>Cotización original</Text>
            <Text style={{ fontSize: 10, color: "#1E293B" }}>
              ${originalQuote.toLocaleString("es-MX")}
            </Text>
          </View>
          {discountApplied > 0 && (
            <View style={styles.finRow}>
              <Text style={{ fontSize: 10, color: "#64748B" }}>Descuento aplicado</Text>
              <Text style={{ fontSize: 10, color: "#10B981" }}>
                -${discountApplied.toLocaleString("es-MX")}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Final</Text>
            <Text style={styles.totalValue}>
              ${finalAmount.toLocaleString("es-MX")}
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento oficial generado por el sistema Sbeltic — Durango, México
          </Text>
        </View>
      </Page>
    </Document>
  );
}
