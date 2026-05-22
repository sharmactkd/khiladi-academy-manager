import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
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
    feePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeePlan",
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: [0, "Final amount cannot be negative"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"],
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "partial", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank", "online", "other"],
      default: "cash",
    },
    receiptNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Note cannot exceed 1000 characters"],
    },
    collectedBy: {
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

feePaymentSchema.index({ academy: 1, student: 1 });
feePaymentSchema.index({ academy: 1, month: 1 });
feePaymentSchema.index({ academy: 1, status: 1 });
feePaymentSchema.index(
  { academy: 1, receiptNumber: 1 },
  { unique: true, sparse: true }
);

feePaymentSchema.pre("validate", function (next) {
  const amount = Number(this.amount || 0);
  const discount = Number(this.discount || 0);
  this.finalAmount = Math.max(amount - discount, 0);

  if (this.status === "paid" && !this.paidDate) {
    this.paidDate = new Date();
  }

  next();
});

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

export default FeePayment;