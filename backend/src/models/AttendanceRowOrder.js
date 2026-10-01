import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String },
  academy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  keys: { type: [String], default: [] },
  // Month-specific student state. Once a month becomes historical this keeps
  // later profile status changes from rewriting the old register.
  statuses: {
    type: [{
      _id: false,
      key: { type: String, required: true },
      status: { type: String, enum: ["active", "inactive", "imported"], required: true },
    }],
    default: [],
  },
  snapshotSource: { type: String, enum: ["explicit-save"], default: undefined },
  baselineYear: { type: Number, default: null },
  baselineMonth: { type: Number, default: null },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("AttendanceRowOrder", schema);
