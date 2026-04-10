import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // El doctor que querían
      required: true,
    },
    desiredDate: {
      type: Date,
      required: true, // El día que querían
    },
    status: {
      type: String,
      enum: ["WAITING", "NOTIFIED", "RESOLVED", "EXPIRED"],
      default: "WAITING",
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

waitlistSchema.index({ doctorId: 1, desiredDate: 1, status: 1 });
waitlistSchema.index({ status: 1, notifiedAt: 1 });

const Waitlist = mongoose.model("Waitlist", waitlistSchema);
export default Waitlist;
