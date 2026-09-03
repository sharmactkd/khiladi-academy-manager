import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String },
  academy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  keys: { type: [String], default: [] },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("AttendanceRowOrder", schema);
