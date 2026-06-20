import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
    method: { type: String, enum: ["CASH", "COUPON"], default: "CASH" },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const patientDeudaSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    concept: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    payments: [paymentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

patientDeudaSchema.virtual("paidAmount").get(function () {
  return this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
});

patientDeudaSchema.virtual("balance").get(function () {
  return Math.max(0, this.totalAmount - this.paidAmount);
});

patientDeudaSchema.virtual("status").get(function () {
  const paid = this.paidAmount;
  if (paid <= 0) return "PENDING";
  if (paid >= this.totalAmount) return "PAID";
  return "PARTIAL";
});

patientDeudaSchema.index({ patientId: 1, createdAt: -1 });

const PatientDeuda = mongoose.model("PatientDeuda", patientDeudaSchema);
export default PatientDeuda;
