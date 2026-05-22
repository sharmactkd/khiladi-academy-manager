import mongoose from "mongoose";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const batchSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    batchName: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
      maxlength: [100, "Batch name cannot exceed 100 characters"],
    },
    martialArt: {
      type: String,
      required: [true, "Martial art is required"],
      trim: true,
      maxlength: [80, "Martial art cannot exceed 80 characters"],
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assistantCoaches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    days: {
      type: [String],
      enum: DAYS,
      default: [],
    },
    startTime: {
      type: String,
      trim: true,
      default: "",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be HH:mm"],
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be HH:mm"],
    },
    maxStudents: {
      type: Number,
      min: [0, "Max students cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
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

batchSchema.index({ academy: 1, batchName: 1 }, { unique: true });
batchSchema.index({ academy: 1, martialArt: 1 });
batchSchema.index({ academy: 1, status: 1 });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;