import mongoose from "mongoose";

const integrationLogSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      default: null,
      index: true,
    },
    integration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentIntegration",
      default: null,
    },
    direction: {
      type: String,
      enum: ["outbound", "inbound"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "connect",
        "disconnect",
        "regenerate_key",
        "entry_submit",
        "result_import",
        "webhook",
        "status_check",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "duplicate"],
      required: true,
      index: true,
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

integrationLogSchema.index({ academy: 1, createdAt: -1 });
integrationLogSchema.index({ academy: 1, type: 1 });
integrationLogSchema.index({ academy: 1, status: 1 });

const IntegrationLog = mongoose.model("IntegrationLog", integrationLogSchema);

export default IntegrationLog;