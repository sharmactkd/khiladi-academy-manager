import mongoose from "mongoose";

const schema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
  type: { type: String, enum: ["income", "expense"], required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0 },
  account: { type: String, enum: ["cash", "bank", "upi", "other"], default: "cash" },
  date: { type: Date, required: true, index: true },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  sourceType: { type: String, default: "manual" },
  sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reversedAt: { type: Date, default: null },
  reversalReason: { type: String, trim: true, maxlength: 300, default: "" },
}, { timestamps: true });

schema.index({ academy: 1, sourceType: 1, sourceId: 1 }, { unique: true, partialFilterExpression: { sourceId: { $type: "objectId" } } });
export default mongoose.model("ExpenseTransaction", schema);
