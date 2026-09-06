import mongoose from "mongoose";

const attendanceImportMappingSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    sourceKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    sourceSheet: { type: String, trim: true, default: "", maxlength: 120 },
    importedName: { type: String, trim: true, default: "", maxlength: 150 },
    importedPhone: { type: String, trim: true, default: "", maxlength: 30 },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

attendanceImportMappingSchema.index(
  { academy: 1, batch: 1, sourceKey: 1 },
  { unique: true }
);

export default mongoose.model(
  "AttendanceImportMapping",
  attendanceImportMappingSchema
);
