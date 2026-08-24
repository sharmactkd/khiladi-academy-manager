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
    version: {
      type: Number,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    orientation: {
      type: String,
      enum: ["horizontal", "vertical"],
      default: "horizontal",
    },
    cardSize: {
      type: String,
      enum: ["cr80", "cr79", "cr100", "business", "custom"],
      default: "cr80",
    },
    customSize: {
      width: { type: Number, default: null, min: 1, max: 100 },
      height: { type: Number, default: null, min: 1, max: 100 },
      unit: { type: String, enum: ["cm", "in"], default: "cm" },
      _id: false,
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
    primaryColor: {
      type: String,
      trim: true,
      default: "#10223e",
    },
    secondaryColor: {
      type: String,
      trim: true,
      default: "#e50914",
    },
    accentColor: {
      type: String,
      trim: true,
      default: "#d4af37",
    },
    fontFamily: {
      type: String,
      trim: true,
      default: "Inter",
    },
    photoShape: {
      type: String,
      enum: ["circle", "rounded", "square"],
      default: "circle",
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
