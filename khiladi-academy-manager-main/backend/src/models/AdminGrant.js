import mongoose from "mongoose";

const adminGrantSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "Plan is required"],
    },
    planCode: {
      type: String,
      enum: ["free", "basic", "pro", "premium", "enterprise"],
      required: [true, "Plan code is required"],
      index: true,
    },
    grantType: {
      type: String,
      enum: ["trial_extension", "free_access", "lifetime", "custom"],
      required: [true, "Grant type is required"],
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Granted by is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

adminGrantSchema.index({ academy: 1, isActive: 1 });
adminGrantSchema.index({ academy: 1, grantType: 1 });

const AdminGrant = mongoose.model("AdminGrant", adminGrantSchema);

export default AdminGrant;