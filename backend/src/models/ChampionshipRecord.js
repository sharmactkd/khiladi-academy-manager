import mongoose from "mongoose";

const championshipRecordSchema = new mongoose.Schema(
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
    championshipName: {
      type: String,
      required: [true, "Championship name is required"],
      trim: true,
      minlength: [2, "Championship name must be at least 2 characters"],
      maxlength: [150, "Championship name cannot exceed 150 characters"],
    },
    level: {
      type: String,
      enum: ["district", "state", "national", "international", "open"],
      default: "open",
      index: true,
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
    result: {
      type: String,
      enum: ["gold", "silver", "bronze", "participated", "disqualified"],
      default: "participated",
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Championship date is required"],
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
    certificateUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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

championshipRecordSchema.index({ academy: 1, student: 1 });
championshipRecordSchema.index({ academy: 1, date: -1 });
championshipRecordSchema.index({ academy: 1, result: 1 });
championshipRecordSchema.index({ academy: 1, level: 1 });
championshipRecordSchema.index({ academy: 1, eventType: 1 });
championshipRecordSchema.index({ academy: 1, isDeleted: 1 });

const ChampionshipRecord = mongoose.model(
  "ChampionshipRecord",
  championshipRecordSchema
);

export default ChampionshipRecord;