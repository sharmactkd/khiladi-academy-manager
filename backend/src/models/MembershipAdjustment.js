import mongoose from "mongoose";

const membershipAdjustmentSchema = new mongoose.Schema(
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
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentMembership",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "extend_days",
        "reduce_days",
        "set_due_date",
        "set_remaining_days",
        "change_unpaid_months",
        "pause",
        "resume",
        "set_fee_status",
        "set_note",
        "reversal",
      ],
      index: true,
    },
    days: { type: Number, default: 0 },
    months: { type: Number, default: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    previousState: { type: mongoose.Schema.Types.Mixed, required: true },
    nextState: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reversedAt: { type: Date, default: null },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipAdjustment",
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

membershipAdjustmentSchema.index({ academy: 1, student: 1, createdAt: -1 });
membershipAdjustmentSchema.index({ membership: 1, createdAt: -1 });

const MembershipAdjustment = mongoose.model(
  "MembershipAdjustment",
  membershipAdjustmentSchema
);

export default MembershipAdjustment;
