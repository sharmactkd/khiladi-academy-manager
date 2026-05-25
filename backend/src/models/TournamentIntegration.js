import mongoose from "mongoose";

const tournamentIntegrationSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    integrationName: {
      type: String,
      trim: true,
      default: "KHILADI Tournament Manager",
    },
    provider: {
      type: String,
      enum: ["khiladi_tournament_manager"],
      default: "khiladi_tournament_manager",
      required: true,
    },
    apiBaseUrl: {
      type: String,
      trim: true,
      default: "",
    },
    apiKeyHash: {
      type: String,
      required: [true, "API key hash is required"],
      select: false,
    },
    webhookSecretHash: {
      type: String,
      required: [true, "Webhook secret hash is required"],
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active",
      index: true,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      trim: true,
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

tournamentIntegrationSchema.index(
  { academy: 1, provider: 1 },
  { unique: true }
);
tournamentIntegrationSchema.index({ academy: 1, status: 1 });

const TournamentIntegration = mongoose.model(
  "TournamentIntegration",
  tournamentIntegrationSchema
);

export default TournamentIntegration;