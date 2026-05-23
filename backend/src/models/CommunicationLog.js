import mongoose from "mongoose";

const communicationLogSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ["email", "whatsapp", "internal"],
      required: [true, "Communication channel is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "fee_reminder",
        "attendance_alert",
        "belt_test",
        "championship",
        "system",
      ],
      default: "system",
      index: true,
    },
    to: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      default: "",
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: "",
    },
    errorMessage: {
      type: String,
      trim: true,
      default: "",
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
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

communicationLogSchema.index({ academy: 1, channel: 1 });
communicationLogSchema.index({ academy: 1, type: 1 });
communicationLogSchema.index({ academy: 1, status: 1 });
communicationLogSchema.index({ academy: 1, createdAt: -1 });

const CommunicationLog = mongoose.model(
  "CommunicationLog",
  communicationLogSchema
);

export default CommunicationLog;