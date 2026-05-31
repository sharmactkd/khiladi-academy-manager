import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    importedName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Imported name cannot exceed 120 characters"],
    },

    importedPhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: [20, "Imported phone cannot exceed 20 characters"],
    },

    importedAdmissionNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        50,
        "Imported admission number cannot exceed 50 characters",
      ],
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      required: [true, "Attendance status is required"],
      default: "present",
    },

    source: {
      type: String,
      enum: ["manual", "excel-import"],
      default: "manual",
      index: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Note cannot exceed 300 characters"],
    },
  },
  { _id: false }
);

attendanceRecordSchema.pre("validate", function validateAttendanceRecord(next) {
  const hasStudent = Boolean(this.student);
  const hasImportedIdentity = Boolean(
    String(this.importedName || "").trim() ||
      String(this.importedPhone || "").trim() ||
      String(this.importedAdmissionNumber || "").trim()
  );

  if (!hasStudent && !hasImportedIdentity) {
    this.invalidate(
      "student",
      "Either student or imported student identity is required"
    );
  }

  
});

const attendanceSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch is required"],
      index: true,
    },

    date: {
      type: Date,
      required: [true, "Attendance date is required"],
      index: true,
    },

    records: {
      type: [attendanceRecordSchema],
      default: [],
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ academy: 1, batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ academy: 1, date: 1 });
attendanceSchema.index({ academy: 1, batch: 1 });
attendanceSchema.index({ "records.student": 1 });
attendanceSchema.index({ "records.importedName": 1 });
attendanceSchema.index({ "records.importedPhone": 1 });
attendanceSchema.index({ "records.source": 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;