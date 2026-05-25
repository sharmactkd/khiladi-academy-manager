import mongoose from "mongoose";

const tournamentEntrySyncSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },
    integration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentIntegration",
      default: null,
    },
    externalTournamentId: {
      type: String,
      required: [true, "External tournament ID is required"],
      trim: true,
      index: true,
    },
    externalPlayerId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    tournamentName: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [150, "Tournament name cannot exceed 150 characters"],
    },
    eventType: {
      type: String,
      enum: ["kyorugi", "poomsae", "demo", "other"],
      default: "kyorugi",
      index: true,
    },
    ageCategory: {
      type: String,
      trim: true,
      default: "",
    },
    weightCategory: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    syncStatus: {
      type: String,
      enum: ["pending", "synced", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

tournamentEntrySyncSchema.index({ academy: 1, student: 1 });
tournamentEntrySyncSchema.index({ academy: 1, externalTournamentId: 1 });
tournamentEntrySyncSchema.index(
  { academy: 1, externalTournamentId: 1, externalPlayerId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { externalPlayerId: { $type: "string", $ne: "" } },
  }
);
tournamentEntrySyncSchema.index({ academy: 1, syncStatus: 1 });
tournamentEntrySyncSchema.index(
  {
    academy: 1,
    student: 1,
    externalTournamentId: 1,
    eventType: 1,
    weightCategory: 1,
  },
  {
    unique: true,
    partialFilterExpression: { syncStatus: { $ne: "cancelled" } },
  }
);

const TournamentEntrySync = mongoose.model(
  "TournamentEntrySync",
  tournamentEntrySyncSchema
);

export default TournamentEntrySync;