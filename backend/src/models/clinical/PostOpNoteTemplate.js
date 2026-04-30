import mongoose from "mongoose";

const postOpNoteTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    procedureTag: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

postOpNoteTemplateSchema.index({ title: 1 });
postOpNoteTemplateSchema.index({ procedureTag: 1 });

const PostOpNoteTemplate = mongoose.model(
  "PostOpNoteTemplate",
  postOpNoteTemplateSchema,
);
export default PostOpNoteTemplate;
