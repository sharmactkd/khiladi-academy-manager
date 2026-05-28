import mongoose from "mongoose";

const feePlanSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Fee plan name is required"],
      trim: true,
      maxlength: [120, "Fee plan name cannot exceed 120 characters"],
    },

    monthlyAmount: {
      type: Number,
      required: [true, "Monthly amount is required"],
      min: [0, "Monthly amount cannot be negative"],
    },

    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "custom"],
      default: "monthly",
    },

    dueDay: {
      type: Number,
      default: 10,
      min: [1, "Due day must be between 1 and 31"],
      max: [31, "Due day must be between 1 and 31"],
    },

    martialArt: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
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
feePlanSchema.index({ academy: 1, batch: 1 });
feePlanSchema.index({ academy: 1, isActive: 1 });
feePlanSchema.index({ academy: 1, isDefault: 1 });

feePlanSchema.pre("validate", function (next) {
  if (this.monthlyAmount === undefined || this.monthlyAmount === null) {
    this.monthlyAmount = Number(this.amount || 0);
  }

  this.amount = this.monthlyAmount;

  next();
});

const FeePlan = mongoose.model("FeePlan", feePlanSchema);

export default FeePlan;