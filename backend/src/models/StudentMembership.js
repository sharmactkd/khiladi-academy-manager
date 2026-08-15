import mongoose from "mongoose";

const studentMembershipSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "expired", "complimentary"],
      default: "active",
      index: true,
    },
    startDate: { type: Date, default: null },
    originalDueDate: { type: Date, default: null },
    effectiveDueDate: { type: Date, default: null, index: true },
    remainingTrainingDays: { type: Number, default: 0, min: 0 },
    unpaidMonths: { type: Number, default: 0, min: 0 },
    feeRequired: { type: Boolean, default: true },
    feeStatus: {
      type: String,
      enum: ["paid", "due", "partial", "overdue", "waived", "complimentary"],
      default: "due",
      index: true,
    },
    internalNote: { type: String, trim: true, maxlength: 1000, default: "" },
    lastAdjustedAt: { type: Date, default: null },
    lastAdjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, optimisticConcurrency: true }
);

studentMembershipSchema.index({ academy: 1, student: 1 }, { unique: true });
studentMembershipSchema.index({ academy: 1, status: 1, effectiveDueDate: 1 });
studentMembershipSchema.index({ academy: 1, feeStatus: 1, unpaidMonths: 1 });

const StudentMembership = mongoose.model(
  "StudentMembership",
  studentMembershipSchema
);

export default StudentMembership;
