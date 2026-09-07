import mongoose from "mongoose";

const schema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
  type: { type: String, enum: ["income", "expense"], required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  normalizedName: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

schema.index({ academy: 1, type: 1, normalizedName: 1 }, { unique: true });
export default mongoose.model("ExpenseCategory", schema);
