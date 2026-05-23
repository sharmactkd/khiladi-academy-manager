import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
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
      index: true,
    },

    planCode: {
      type: String,
      enum: ["free", "basic", "pro", "premium", "enterprise"],
      required: [true, "Plan code is required"],
    },

    status: {
      type: String,
      enum: [
        "trial",
        "active",
        "expired",
        "cancelled",
        "lifetime",
        "admin_granted",
      ],
      default: "active",
      index: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },

    nextBillingDate: {
      type: Date,
      default: null,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "custom"],
      default: "monthly",
    },

    source: {
      type: String,
      enum: ["razorpay", "coupon", "admin_grant", "manual", "free"],
      default: "free",
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpaySubscriptionId: {
      type: String,
      trim: true,
      default: "",
    },

    lastPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
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
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ academy: 1, isCurrent: 1 });
subscriptionSchema.index({ academy: 1, status: 1 });
subscriptionSchema.index({ planCode: 1 });
subscriptionSchema.index({ endDate: 1 });

const Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);

export default Subscription;