import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_months"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    freeMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicablePlanCodes: {
      type: [String],
      default: [],
    },
    applicableAddOnCodes: {
      type: [String],
      default: [],
    },
    appliesTo: {
      type: String,
      enum: ["plans", "add_ons", "both"],
      default: "plans",
    },
    minimumAmount: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: 0, min: 0 },
    maxRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perAcademyLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
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

couponSchema.index({ isActive: 1, expiresAt: 1 });
couponSchema.pre("validate", function validateCouponRules(next) {
  if (this.discountType === "percentage" && Number(this.discountValue) > 100) return next(new Error("Percentage discount cannot exceed 100"));
  if (this.discountType === "free_months" && Number(this.freeMonths) < 1) return next(new Error("Free-month coupon requires at least one month"));
  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) return next(new Error("Coupon expiry must be after its start date"));
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
