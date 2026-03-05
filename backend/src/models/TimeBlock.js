import mongoose from "mongoose";

const timeBlockSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["LUNCH", "VACATION", "MEETING", "PERSONAL", "OTHER"],
      default: "PERSONAL",
    },
    reason: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Índice para que el motor de colisiones encuentre los bloqueos rápido
timeBlockSchema.index({ doctorId: 1, startTime: 1, endTime: 1 });

export default mongoose.model("TimeBlock", timeBlockSchema);
