import mongoose from "mongoose";
import { CERTIFICATE_TYPES } from "./CertificateTemplate.js";

const generatedCertificateSchema = new mongoose.Schema(
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
      ref: "CertificateTemplate",
      required: [true, "Certificate template is required"],
    },
    certificateType: {
      type: String,
      enum: CERTIFICATE_TYPES,
      required: [true, "Certificate type is required"],
      index: true,
    },
    templateVersion: { type: Number, default: 1 },
    templateSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    studentSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    academySnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    sourceSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    contentSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    verificationId: { type: String, trim: true, default: undefined },
    verificationTokenHash: { type: String, select: false, default: "" },
    qrCodeData: { type: String, trim: true, default: "" },
    certificateNumber: {
      type: String,
      required: [true, "Certificate number is required"],
      trim: true,
      uppercase: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    relatedBeltTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BeltTest",
      default: null,
    },
    relatedChampionshipRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChampionshipRecord",
      default: null,
    },
    status: {
      type: String,
      enum: ["issued", "cancelled"],
      default: "issued",
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

generatedCertificateSchema.index(
  { academy: 1, certificateNumber: 1 },
  { unique: true }
);
generatedCertificateSchema.index({ academy: 1, student: 1 });
generatedCertificateSchema.index({ academy: 1, certificateType: 1 });
generatedCertificateSchema.index({ academy: 1, status: 1 });
generatedCertificateSchema.index({ verificationId: 1 }, { unique: true, sparse: true });

const GeneratedCertificate = mongoose.model(
  "GeneratedCertificate",
  generatedCertificateSchema
);

export default GeneratedCertificate;
