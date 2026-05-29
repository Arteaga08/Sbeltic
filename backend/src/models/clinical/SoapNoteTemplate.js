import mongoose from "mongoose";

const soapNoteTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    procedureTag: { type: String, trim: true, default: "" },
    subjective: { type: String, default: "" }, // S - Subjetivo
    objective: { type: String, default: "" }, // O - Objetivo
    assessment: { type: String, default: "" }, // A - Análisis/Evaluación
    plan: { type: String, default: "" }, // P - Plan
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

soapNoteTemplateSchema.index({ title: 1 });
soapNoteTemplateSchema.index({ procedureTag: 1 });

const SoapNoteTemplate = mongoose.model(
  "SoapNoteTemplate",
  soapNoteTemplateSchema,
);
export default SoapNoteTemplate;
