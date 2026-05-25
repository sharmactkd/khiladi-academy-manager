import mongoose from "mongoose";

const tournamentResultSyncSchema = new mongoose.Schema(
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
    entrySync: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentEntrySync",
      default: null,
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
    level: {
      type: String,
      enum: ["district", "state", "national", "international", "open"],
      default: "open",
      index: true,
    },
    result: {
      type: String,
      enum: ["gold", "silver", "bronze", "participated", "disqualified"],
      required: [true, "Result is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Result date is required"],
      index: true,
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    organizer: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    championshipRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChampionshipRecord",
      default: null,
    },
    syncSource: {
      type: String,
      enum: ["manual_import", "webhook", "external_api"],
      required: true,
      index: true,
    },
    syncStatus: {
      type: String,
      enum: ["imported", "duplicate", "failed"],
      default: "imported",
      index: true,
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

tournamentResultSyncSchema.index({ academy: 1, student: 1 });
tournamentResultSyncSchema.index({ academy: 1, externalTournamentId: 1 });
tournamentResultSyncSchema.index(
  { academy: 1, externalTournamentId: 1, externalPlayerId: 1, result: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { externalPlayerId: { $type: "string", $ne: "" } },
  }
);
tournamentResultSyncSchema.index({ academy: 1, syncSource: 1 });
tournamentResultSyncSchema.index({ academy: 1, syncStatus: 1 });

const TournamentResultSync = mongoose.model(
  "TournamentResultSync",
  tournamentResultSyncSchema
);

export default TournamentResultSync;