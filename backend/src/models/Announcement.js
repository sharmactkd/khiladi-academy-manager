import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Announcement message is required"],
      trim: true,
      minlength: [2, "Message must be at least 2 characters"],
      maxlength: [3000, "Message cannot exceed 3000 characters"],
    },
    category: {
      type: String,
      enum: [
        "general",
        "fees",
        "attendance",
        "belt_test",
        "championship",
        "holiday",
        "urgent",
      ],
      default: "general",
      index: true,
    },
    audienceType: {
      type: String,
      enum: ["all", "students", "parents", "batch", "individual"],
      default: "all",
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    students: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
      ],
      default: [],
    },
    guardianUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    publishAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    channels: {
      type: [
        {
          type: String,
          enum: ["internal", "email", "whatsapp"],
        },
      ],
      default: ["internal"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
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

announcementSchema.index({ academy: 1, status: 1 });
announcementSchema.index({ academy: 1, publishAt: -1 });
announcementSchema.index({ academy: 1, audienceType: 1 });
announcementSchema.index({ academy: 1, priority: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;