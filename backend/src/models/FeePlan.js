import mongoose from "mongoose";

const feePlanSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Fee plan name is required"],
      trim: true,
      maxlength: [100, "Fee plan name cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "custom"],
      default: "monthly",
    },
    martialArt: {
      type: String,
      trim: true,
      default: "",
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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

feePlanSchema.index({ academy: 1, name: 1 });
feePlanSchema.index({ academy: 1, isActive: 1 });

const FeePlan = mongoose.model("FeePlan", feePlanSchema);

export default FeePlan;