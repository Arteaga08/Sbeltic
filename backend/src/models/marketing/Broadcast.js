import mongoose from "mongoose";

// 📣 Campaña de difusión libre por WhatsApp.
// Se redacta un mensaje y se envía a una selección de pacientes existentes mediante
// enlaces wa.me (envío manual). Se guarda snapshot de name/phone para mantener el
// historial estable aunque el paciente cambie o se elimine después.
const recipientSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
  },
  { _id: false },
);

const broadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1024,
    },
    recipients: [recipientSchema],
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// 🌟 Patrón Next.js + Mongoose: reutiliza el modelo si ya existe en memoria.
export default mongoose.models.Broadcast ||
  mongoose.model("Broadcast", broadcastSchema);
