import mongoose from "mongoose";

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },

    snapshotType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
      index: true,
    },

    snapshotDate: {
      type: Date,
      required: true,
      index: true,
    },

    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

analyticsSnapshotSchema.index({
  academy: 1,
  branch: 1,
  snapshotType: 1,
  snapshotDate: 1,
});

const AnalyticsSnapshot = mongoose.model(
  "AnalyticsSnapshot",
  analyticsSnapshotSchema
);

export default AnalyticsSnapshot;