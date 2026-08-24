import mongoose from "mongoose";

const championshipEntrySchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Primary Entry", maxlength: 120 },
    eventType: { type: String, trim: true, default: "Kyorugi" },
    poomsaeType: { type: String, trim: true, default: "" },
    gender: { type: String, trim: true, default: "" },
    ageCategory: { type: String, trim: true, default: "" },
    weightCategory: { type: String, trim: true, default: "" },
    beltCategory: { type: String, trim: true, default: "" },
    danCategory: { type: String, trim: true, default: "" },
    entryFeeOverride: { type: Number, default: null, min: 0 },
    result: { type: String, trim: true, default: "Participation" },
    disqualificationReason: { type: String, trim: true, default: "", maxlength: 500 },
    ranking: { type: Number, default: null, min: 1 },
    totalBouts: { type: Number, default: 0, min: 0 },
    bouts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    remarks: { type: String, trim: true, default: "", maxlength: 1000 },
    legacyRecord: { type: mongoose.Schema.Types.ObjectId, ref: "ChampionshipRecord", default: null },
  },
  { timestamps: true }
);

const academyEventParticipantSchema = new mongoose.Schema(
  {
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "AcademyEvent", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    status: { type: String, enum: ["registered", "confirmed", "completed", "withdrawn"], default: "registered", index: true },
    baseFeeSnapshot: { type: Number, default: 0, min: 0 },
    additionalEntryFeeSnapshot: { type: Number, default: 0, min: 0 },
    feeOverride: { type: Number, default: null, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    finalPayable: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "partial", "paid", "waived", "refunded"], default: "unpaid", index: true },
    paymentMode: { type: String, enum: ["", "cash", "online", "cash_online"], default: "" },
    paymentDate: { type: Date, default: null },
    receiptNumber: { type: String, trim: true, default: "" },
    feeNote: { type: String, trim: true, default: "", maxlength: 500 },
    currentBelt: { type: String, trim: true, default: "" },
    currentDanRank: { type: String, trim: true, default: "" },
    promotedToBelt: { type: String, trim: true, default: "" },
    promotedToDanRank: { type: String, trim: true, default: "" },
    marks: { type: Number, default: null, min: 0 },
    outOf: { type: Number, default: null, min: 0 },
    result: { type: String, enum: ["pending", "pass", "fail"], default: "pending" },
    examinerRemarks: { type: String, trim: true, default: "", maxlength: 1000 },
    certificateNumber: { type: String, trim: true, default: "" },
    legacyBeltTest: { type: mongoose.Schema.Types.ObjectId, ref: "BeltTest", default: null },
    entries: { type: [championshipEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

academyEventParticipantSchema.index(
  { event: 1, student: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
academyEventParticipantSchema.index({ academy: 1, paymentStatus: 1 });

academyEventParticipantSchema.pre("validate", function calculateFee() {
  const additionalEntries = Math.max(Number(this.entries?.length || 0) - 1, 0);
  const calculatedEntryFee = (this.entries || []).slice(1).reduce(
    (total, entry) => total + (
      entry.entryFeeOverride === null || entry.entryFeeOverride === undefined
        ? Number(this.additionalEntryFeeSnapshot || 0)
        : Number(entry.entryFeeOverride || 0)
    ),
    0
  );
  const base = this.feeOverride === null || this.feeOverride === undefined
    ? Number(this.baseFeeSnapshot || 0) + (additionalEntries ? calculatedEntryFee : 0)
    : Number(this.feeOverride || 0);
  this.finalPayable = Math.max(base - Number(this.discount || 0), 0);
  this.pendingAmount = Math.max(this.finalPayable - Number(this.amountPaid || 0), 0);

  if (this.paymentStatus === "waived" || this.paymentStatus === "refunded") return;
  if (this.finalPayable === 0) this.paymentStatus = "waived";
  else if (this.amountPaid >= this.finalPayable) this.paymentStatus = "paid";
  else if (this.amountPaid > 0) this.paymentStatus = "partial";
  else this.paymentStatus = "unpaid";
});

export default mongoose.model("AcademyEventParticipant", academyEventParticipantSchema);
