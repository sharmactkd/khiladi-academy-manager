import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      required: [true, "Attendance status is required"],
      default: "present",
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
attendanceSchema.index({ "records.student": 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;