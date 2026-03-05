import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true }, // 👈 Nombre definitivo
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    categories: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ categories: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export default Supplier;
