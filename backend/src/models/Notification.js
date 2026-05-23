import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
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
      required: [true, "Recipient user is required"],
      index: true,
    },
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "fee_reminder",
        "attendance",
        "belt_test",
        "championship",
        "certificate",
        "id_card",
        "system",
      ],
      default: "system",
      index: true,
    },
    sourceModule: {
      type: String,
      trim: true,
      default: "",
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ academy: 1, recipientUser: 1, isRead: 1 });
notificationSchema.index({ academy: 1, type: 1 });
notificationSchema.index({ academy: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;