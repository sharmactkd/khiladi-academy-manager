import mongoose from "mongoose";

const entitlementSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", default: null, index: true },
    addOn: { type: mongoose.Schema.Types.ObjectId, ref: "AddOnDefinition", required: true },
    code: { type: String, required: true, lowercase: true, trim: true, index: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: ["active", "grace", "expired", "cancelled", "suspended"],
      default: "active",
      index: true,
    },
    startDate: { type: Date, default: Date.now, required: true },
    endDate: { type: Date, required: true, index: true },
    graceEndsAt: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["razorpay", "play_billing", "admin_grant", "manual", "coupon"],
      default: "razorpay",
    },
    unitPrice: { type: Number, required: true, min: 0 },
    priceVersion: { type: Number, required: true, min: 1, default: 1 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    cancellationReason: { type: String, default: "", trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

entitlementSchema.index({ owner: 1, academy: 1, code: 1, status: 1 });
entitlementSchema.index({ status: 1, endDate: 1 });

export default mongoose.model("Entitlement", entitlementSchema);
