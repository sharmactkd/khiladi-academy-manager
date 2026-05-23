import mongoose from "mongoose";

const reportLogSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },

    reportType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    format: {
      type: String,
      enum: ["json", "csv", "excel", "pdf"],
      default: "json",
    },

    status: {
      type: String,
      enum: ["generated", "failed"],
      default: "generated",
      index: true,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

reportLogSchema.index({
  academy: 1,
  reportType: 1,
  generatedAt: -1,
});

const ReportLog = mongoose.model("ReportLog", reportLogSchema);

export default ReportLog;