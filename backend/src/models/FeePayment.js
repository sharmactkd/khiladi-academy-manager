import mongoose from "mongoose";

const paymentInstallmentSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, trim: true, maxlength: 120, required: true },
    receiptNumber: { type: String, trim: true, uppercase: true, required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    cashAmount: { type: Number, default: 0, min: 0 },
    onlineAmount: { type: Number, default: 0, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "online", "cash_online", "upi", "bank", "card", "other"],
      required: true,
    },
    paymentDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reversedAt: { type: Date, default: null },
    reversalReason: { type: String, trim: true, maxlength: 300, default: "" },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

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

    // One request can allocate a collection across several fee months.  This
    // key makes each monthly allocation replay-safe without changing the
    // legacy one-ledger-row-per-student/month contract.
    collectionId: { type: String, trim: true, maxlength: 120, default: "", index: true },
    collectionKey: { type: String, trim: true, maxlength: 180, default: undefined },
    installments: { type: [paymentInstallmentSchema], default: [] },
    reversedAt: { type: Date, default: null, index: true },
    reversalReason: { type: String, trim: true, maxlength: 300, default: "" },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

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
  { academy: 1, collectionKey: 1 },
  {
    unique: true,
    // Compound sparse indexes still include legacy documents when `academy`
    // exists and `collectionKey` is null. Only real, non-empty idempotency
    // keys belong in this unique index.
    partialFilterExpression: {
      collectionKey: { $type: "string", $gt: "" },
    },
  }
);

feePaymentSchema.index(
  { academy: 1, student: 1, feeYear: 1, feeMonth: 1 },
  { unique: true }
);

feePaymentSchema.pre("validate", function () {
  const amount = Number(this.amount || 0);
  const discount = Number(this.discount || 0);
  // A cancelled ledger keeps its original collected amount for audit and
  // receipt history; dashboards exclude it by status and its income entry is
  // reversed separately in the same database transaction.
  if (this.installments?.length && this.status !== "cancelled") {
    const active = this.installments.filter((item) => !item.reversedAt);
    this.amountPaid = active.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
    this.cashAmount = active.reduce((sum, item) => sum + Number(item.cashAmount || 0), 0);
    this.onlineAmount = active.reduce((sum, item) => sum + Number(item.onlineAmount || 0), 0);
    const latest = active.slice().sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
    if (latest) {
      this.paymentDate = latest.paymentDate;
      this.paidDate = this.amountPaid >= Math.max(Number(this.amount || 0) - Number(this.discount || 0), 0)
        ? latest.paymentDate
        : null;
      this.paymentMode = this.cashAmount > 0 && this.onlineAmount > 0
        ? "cash_online"
        : this.onlineAmount > 0 ? "online" : "cash";
    }
  }
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
    if (this.finalAmount === 0 || amountPaid >= this.finalAmount) {
      this.status = "paid";
      this.paidDate = this.paymentDate || new Date();
    } else if (amountPaid > 0 && amountPaid < this.finalAmount) {
      this.status = "partial";
    } else {
      this.status = "due";
    }
  }
});

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

export default FeePayment;
