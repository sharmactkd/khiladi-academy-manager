import mongoose from "mongoose";

const certificateTemplateSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    templateName: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      minlength: [2, "Template name must be at least 2 characters"],
      maxlength: [100, "Template name cannot exceed 100 characters"],
    },
    certificateType: {
      type: String,
      enum: ["belt", "participation", "achievement", "custom"],
      default: "custom",
      index: true,
    },
    backgroundImage: {
      type: String,
      trim: true,
      default: "",
    },
    layoutJson: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fields: {
      type: [String],
      default: ["studentName", "academyName", "issueDate"],
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
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
  { timestamps: true }
);

certificateTemplateSchema.index({ academy: 1, templateName: 1 });
certificateTemplateSchema.index({ academy: 1, certificateType: 1 });
certificateTemplateSchema.index({ academy: 1, certificateType: 1, isDefault: 1 });
certificateTemplateSchema.index({ academy: 1, isDeleted: 1 });

const CertificateTemplate = mongoose.model(
  "CertificateTemplate",
  certificateTemplateSchema
);

export default CertificateTemplate;