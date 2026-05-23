import mongoose from "mongoose";

const studentTimelineSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        "joined",
        "belt_test",
        "belt_promoted",
        "championship",
        "medal",
        "fee_paid",
        "attendance",
        "certificate",
        "id_card",
        "note",
      ],
      required: [true, "Timeline type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Timeline title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Timeline date is required"],
      index: true,
    },
    sourceModule: {
      type: String,
      enum: [
        "manual",
        "student",
        "belt_test",
        "championship_record",
        "fee_payment",
        "attendance",
        "certificate",
        "id_card",
      ],
      default: "manual",
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

studentTimelineSchema.index({ academy: 1, student: 1, date: -1 });
studentTimelineSchema.index({ academy: 1, type: 1 });
studentTimelineSchema.index({ academy: 1, sourceModule: 1, sourceId: 1 });

const StudentTimeline = mongoose.model(
  "StudentTimeline",
  studentTimelineSchema
);

export default StudentTimeline;