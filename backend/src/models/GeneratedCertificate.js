import mongoose from "mongoose";

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
      enum: ["belt", "participation", "achievement", "custom"],
      required: [true, "Certificate type is required"],
      index: true,
    },
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

const GeneratedCertificate = mongoose.model(
  "GeneratedCertificate",
  generatedCertificateSchema
);

export default GeneratedCertificate;