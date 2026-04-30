import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    presentation: { type: String, trim: true, default: "" },
    dose: { type: String, trim: true, default: "" },
    route: { type: String, trim: true, default: "" },
    frequency: { type: String, trim: true, default: "" },
    duration: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const prescriptionTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    procedureTag: { type: String, trim: true, default: "" },
    medications: { type: [medicationSchema], default: [] },
    generalIndications: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

prescriptionTemplateSchema.index({ title: 1 });
prescriptionTemplateSchema.index({ procedureTag: 1 });

const PrescriptionTemplate = mongoose.model(
  "PrescriptionTemplate",
  prescriptionTemplateSchema,
);
export default PrescriptionTemplate;
