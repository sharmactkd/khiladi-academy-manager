import mongoose from "mongoose";

const addOnDefinitionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: [
        "student_capacity_500",
        "additional_academy",
        "additional_branch",
        "id_card_studio",
        "certificate_studio",
        "document_studio_bundle",
      ],
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    unitSize: { type: Number, default: 1, min: 1 },
    scope: { type: String, enum: ["account", "academy"], required: true },
    stackable: { type: Boolean, default: false },
    fairUseLimit: { type: Number, default: null, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    version: { type: Number, default: 1, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

addOnDefinitionSchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model("AddOnDefinition", addOnDefinitionSchema);
