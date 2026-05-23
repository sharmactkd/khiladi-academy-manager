import mongoose from "mongoose";

const idCardTemplateSchema = new mongoose.Schema(
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
    frontDesign: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    backDesign: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    logo: {
      type: String,
      trim: true,
      default: "",
    },
    backgroundColor: {
      type: String,
      trim: true,
      default: "#ffffff",
    },
    textColor: {
      type: String,
      trim: true,
      default: "#111827",
    },
    fields: {
      type: [String],
      default: ["name", "studentCode", "beltRank", "phone"],
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

idCardTemplateSchema.index({ academy: 1, templateName: 1 });
idCardTemplateSchema.index({ academy: 1, isDefault: 1 });
idCardTemplateSchema.index({ academy: 1, isDeleted: 1 });

const IdCardTemplate = mongoose.model(
  "IdCardTemplate",
  idCardTemplateSchema
);

export default IdCardTemplate;