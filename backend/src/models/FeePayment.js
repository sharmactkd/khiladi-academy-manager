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

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
    currencyCode: { type: String, trim: true, uppercase: true, default: "INR", maxlength: 3 },
    currencySymbol: { type: String, trim: true, default: "₹", maxlength: 12 },

    feePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeePlan",
      default: null,
    },

    feeMonth: {
      type: Number,
      required: [true, "Fee month is required"],
      min: [1, "Fee month must be between 1 and 12"],
      max: [12, "Fee month must be between 1 and 12"],
      index: true,
    },

    feeYear: {
      type: Number,
      required: [true, "Fee year is required"],
      min: [2000, "Fee year is invalid"],
      index: true,
    },

    month: {
      type: String,
      trim: true,
      index: true,
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
      required: true,
      min: [0, "Final amount cannot be negative"],
    },

    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount paid cannot be negative"],
    },

    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, "Pending amount cannot be negative"],
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paidDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["due", "pending", "paid", "overdue", "partial", "cancelled"],
      default: "due",
      index: true,
    },

    paymentMode: {
      type: String,
      // Legacy values remain readable/update-safe; new collection requests are
      // restricted to cash, online and cash_online by feeValidator.js.
      enum: ["cash", "online", "cash_online", "upi", "bank", "card", "other"],
      default: "cash",
      index: true,
    },

    cashAmount: {
      type: Number,
      default: 0,
      min: [0, "Cash amount cannot be negative"],
    },

    onlineAmount: {
      type: Number,
      default: 0,
      min: [0, "Online amount cannot be negative"],
    },

    receiptNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
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
feePaymentSchema.index({ academy: 1, batch: 1 });
feePaymentSchema.index({ academy: 1, feeYear: 1, feeMonth: 1 });
feePaymentSchema.index({ academy: 1, status: 1 });
feePaymentSchema.index({ academy: 1, paymentMode: 1 });

feePaymentSchema.index(
  { academy: 1, receiptNumber: 1 },
  { unique: true, sparse: true }
);

feePaymentSchema.index(
  { academy: 1, student: 1, feeYear: 1, feeMonth: 1 },
  { unique: true }
);

feePaymentSchema.pre("validate", function () {
  const amount = Number(this.amount || 0);
  const discount = Number(this.discount || 0);
  const amountPaid = Number(this.amountPaid || 0);

  if (this.paymentMode === "cash_online") {
    const cashAmount = Number(this.cashAmount || 0);
    const onlineAmount = Number(this.onlineAmount || 0);

    if (cashAmount <= 0 || onlineAmount <= 0) {
      throw new Error("Cash and online amounts must both be greater than zero");
    }

    if (Math.abs(cashAmount + onlineAmount - amountPaid) > 0.01) {
      throw new Error("Cash and online amounts must equal the total amount paid");
    }
  } else if (this.paymentMode === "cash") {
    this.cashAmount = amountPaid;
    this.onlineAmount = 0;
  } else if (this.paymentMode === "online") {
    this.cashAmount = 0;
    this.onlineAmount = amountPaid;
  }

  this.finalAmount = Math.max(amount - discount, 0);
  this.pendingAmount = Math.max(this.finalAmount - amountPaid, 0);

  if (this.feeYear && this.feeMonth) {
    this.month = `${this.feeYear}-${String(this.feeMonth).padStart(2, "0")}`;
  }

  if (!this.note && this.notes) {
    this.note = this.notes;
  }

  if (!this.notes && this.note) {
    this.notes = this.note;
  }

  if (this.status !== "cancelled") {
    if (amountPaid >= this.finalAmount && this.finalAmount > 0) {
      this.status = "paid";
      this.paidDate = this.paymentDate || new Date();
    } else if (amountPaid > 0 && amountPaid < this.finalAmount) {
      this.status = "partial";
    } else if (this.dueDate && new Date() > new Date(this.dueDate)) {
      this.status = "overdue";
    } else {
      this.status = "due";
    }
  }
});

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

export default FeePayment;
