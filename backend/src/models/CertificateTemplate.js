import mongoose from "mongoose";

export const CERTIFICATE_TYPES = [
  "belt",
  "participation",
  "achievement",
  "championship",
  "appreciation",
  "course_completion",
  "instructor_certification",
  "custom",
];

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
      enum: CERTIFICATE_TYPES,
      default: "custom",
      index: true,
    },
    version: { type: Number, min: 1, default: 1 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    pageSize: {
      type: String,
      enum: ["a4"],
      default: "a4",
    },
    orientation: {
      type: String,
      enum: ["landscape", "portrait"],
      default: "landscape",
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
