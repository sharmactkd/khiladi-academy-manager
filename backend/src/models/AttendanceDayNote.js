import mongoose from "mongoose";

const attendanceDayNoteSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["sick-leave", "rainy-day", "championship", "festival", "other"],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    color: {
      type: String,
      trim: true,
      default: "#e2e8f0",
      match: [/^#[0-9a-fA-F]{6}$/, "Color must be a six-digit HEX value"],
    },
    createdBy: {
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

attendanceDayNoteSchema.index(
  { academy: 1, batch: 1, date: 1 },
  { unique: true }
);

const AttendanceDayNote = mongoose.model(
  "AttendanceDayNote",
  attendanceDayNoteSchema
);

export default AttendanceDayNote;
