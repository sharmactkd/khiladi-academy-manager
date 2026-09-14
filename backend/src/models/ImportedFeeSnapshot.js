import mongoose from "mongoose";

const importedFeeSnapshotSchema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null, index: true },
  fingerprint: { type: String, required: true },
  sourceSheet: { type: String, trim: true, maxlength: 120, default: "" },
  sourceAttendanceDate: { type: Date, default: null },
  raw: {
    dueDate: { type: String, default: "" },
    paidDate: { type: String, default: "" },
    feeStatus: { type: String, default: "" },
    feePaid: { type: String, default: "" },
  },
  normalized: {
    dueDate: { type: Date, default: null },
    paidDate: { type: Date, default: null },
    feeStatus: { type: String, enum: ["paid", "partial", "due"], required: true },
    unpaidMonths: { type: Number, min: 0, default: 0 },
    unpaidDays: { type: Number, min: 0, max: 29, default: 0 },
  },
  appliedToMembership: { type: Boolean, default: false },
  appliedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

importedFeeSnapshotSchema.index({ academy: 1, fingerprint: 1 }, { unique: true });
importedFeeSnapshotSchema.index({ academy: 1, student: 1, createdAt: -1 });

export default mongoose.model("ImportedFeeSnapshot", importedFeeSnapshotSchema);
