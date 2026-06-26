import mongoose from "mongoose";

/**
 * StaffEarning
 * Registro de lo ganado por un colaborador (DOCTOR / PHYSIOTHERAPIST) en una cita
 * completada. El monto se precarga desde la cita (finalAmount) y el colaborador lo
 * confirma o ajusta. La comisión que recibe el admin se calcula y se congela (snapshot)
 * al momento de registrar, usando la config de comisión del colaborador.
 */
const staffEarningSchema = new mongoose.Schema(
  {
    collaboratorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // Un registro de ganancia por cita
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },

    // Snapshots para display histórico (no dependen de cambios posteriores)
    patientName: { type: String, trim: true },
    treatmentName: { type: String, trim: true },

    // Monto real ganado por el colaborador en esta cita (ajustable)
    earnedAmount: { type: Number, required: true, min: 0 },

    // Snapshot de la config de comisión al momento de registrar
    commissionType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
    },
    commissionValue: { type: Number, default: 0, min: 0 },

    // Comisión que recibe el admin (calculada en financeService)
    commissionAmount: { type: Number, default: 0, min: 0 },

    // Fecha del servicio (= appointmentDate). Se usa para agrupar por mes.
    serviceDate: { type: Date, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Índice para reportes mensuales por colaborador
staffEarningSchema.index({ collaboratorId: 1, serviceDate: 1 });

export default mongoose.model("StaffEarning", staffEarningSchema);
