import mongoose from "mongoose";

const attendanceMonthMetadataSchema = new mongoose.Schema(
  {
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    year: { type: Number, required: true, min: 1900, max: 2200 },
    month: { type: Number, required: true, min: 1, max: 12 },
    sourceSheet: { type: String, trim: true, default: "", maxlength: 120 },
    importedRowNumber: { type: Number, default: null },
    importedDueDate: { type: String, trim: true, default: "", maxlength: 100 },
    importedPaidDate: { type: String, trim: true, default: "", maxlength: 100 },
    importedFeePaid: { type: String, trim: true, default: "", maxlength: 100 },
    importedFeeStatus: { type: String, trim: true, default: "", maxlength: 100 },
    importedExtraNote: { type: String, trim: true, default: "", maxlength: 200 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

attendanceMonthMetadataSchema.index(
  { academy: 1, batch: 1, student: 1, year: 1, month: 1 },
  { unique: true }
);
attendanceMonthMetadataSchema.index({ academy: 1, student: 1, year: 1, month: 1 });

export default mongoose.model("AttendanceMonthMetadata", attendanceMonthMetadataSchema);
