import mongoose from "mongoose";

const treatmentCategorySchema = new mongoose.Schema(
  {
    /**
     * Identificador único en mayúsculas que debe coincidir con el campo
     * `category` del modelo Treatment (ej: "FACIAL", "CIRUGIA", "DEPILACION").
     * Es la clave de unión entre categorías y tratamientos.
     */
    slug: {
      type: String,
      required: [true, "El slug de la categoría es obligatorio"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    /** Nombre legible para mostrar en UI y en el bot (ej: "Faciales", "Cirugía") */
    name: {
      type: String,
      required: [true, "El nombre de la categoría es obligatorio"],
      trim: true,
    },

    /** Salas/cabinas donde se atiende esta categoría (puede ser más de una) */
    roomIds: {
      type: [String],
      enum: ["CABINA_1", "CABINA_2", "CABINA_3", "SPA", "CONSULTORIO", "QUIROFANO"],
      default: [],
    },

    /**
     * Define en qué flujo del bot WhatsApp aparece esta categoría.
     * AGENDAR → spa/láser (BOT_RECEPTIONIST_ID)
     * COTIZAR → médico (BOT_DOCTOR_ID)
     * BOTH    → ambos flujos
     * NONE    → no aparece en el bot
     */
    botFlow: {
      type: String,
      enum: ["AGENDAR", "COTIZAR", "BOTH", "NONE"],
      default: "NONE",
    },

    /** Clase Tailwind para el tab activo en el frontend (ej: "bg-blue-500 text-white") */
    colorClass: { type: String, trim: true },

    /** Clase Tailwind para el punto de color en listas (ej: "bg-blue-500") */
    dotClass: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

treatmentCategorySchema.index({ botFlow: 1, isActive: 1 });

export default mongoose.model("TreatmentCategory", treatmentCategorySchema);
