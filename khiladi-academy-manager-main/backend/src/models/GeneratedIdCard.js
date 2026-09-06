import mongoose from "mongoose";

const generatedIdCardSchema = new mongoose.Schema(
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
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IdCardTemplate",
      required: [true, "ID card template is required"],
    },
    templateVersion: { type: Number, default: 1 },
    templateSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    studentSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    academySnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    verificationId: { type: String, trim: true, default: undefined },
    verificationTokenHash: { type: String, select: false, default: "" },
    cardNumber: {
      type: String,
      required: [true, "Card number is required"],
      trim: true,
      uppercase: true,
    },
    qrCodeData: {
      type: String,
      trim: true,
      default: "",
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    validTill: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
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

generatedIdCardSchema.index({ academy: 1, template: 1 });
generatedIdCardSchema.index({ academy: 1, student: 1 });
generatedIdCardSchema.index({ academy: 1, cardNumber: 1 }, { unique: true });
generatedIdCardSchema.index({ academy: 1, status: 1 });
generatedIdCardSchema.index({ verificationId: 1 }, { unique: true, sparse: true });

const GeneratedIdCard = mongoose.model(
  "GeneratedIdCard",
  generatedIdCardSchema
);

export default GeneratedIdCard;
