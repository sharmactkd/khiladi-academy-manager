import mongoose from "mongoose";

const schema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
  mode: { type: String, enum: ["scan", "repair"], required: true },
  summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  selectedIssueIds: { type: [String], default: [] },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

schema.index({ academy: 1, createdAt: -1 });
export default mongoose.model("FeeIntegrityRun", schema);
