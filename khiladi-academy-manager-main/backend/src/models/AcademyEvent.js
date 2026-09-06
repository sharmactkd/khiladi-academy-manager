import mongoose from "mongoose";

const feeRulesSchema = new mongoose.Schema(
  {
    defaultFee: { type: Number, default: 0, min: 0 },
    additionalEntryFee: { type: Number, default: 0, min: 0 },
    currencyCode: { type: String, trim: true, uppercase: true, default: "INR", maxlength: 3 },
    currencySymbol: { type: String, trim: true, default: "₹", maxlength: 12 },
    paymentDeadline: { type: Date, default: null },
  },
  { _id: false }
);

const academyEventSchema = new mongoose.Schema(
  {
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
    type: { type: String, enum: ["belt_test", "championship"], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: ["draft", "open", "finalized", "cancelled"], default: "draft", index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    venue: { type: String, trim: true, default: "", maxlength: 300 },
    organizer: { type: String, trim: true, default: "", maxlength: 200 },
    examinerName: { type: String, trim: true, default: "", maxlength: 150 },
    sport: { type: String, trim: true, default: "Taekwondo", maxlength: 100 },
    level: { type: String, trim: true, default: "", maxlength: 100 },
    country: { type: String, trim: true, default: "India", maxlength: 100 },
    state: { type: String, trim: true, default: "", maxlength: 100 },
    city: { type: String, trim: true, default: "", maxlength: 100 },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
    feeRules: { type: feeRulesSchema, default: () => ({}) },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    finalizedAt: { type: Date, default: null },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

academyEventSchema.index({ academy: 1, type: 1, startDate: -1 });
academyEventSchema.index({ academy: 1, status: 1, isDeleted: 1 });

academyEventSchema.pre("validate", function validateDates() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before start date");
  }
});

export default mongoose.model("AcademyEvent", academyEventSchema);
