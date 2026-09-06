import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    scope: { type: String, required: true, unique: true, index: true },
    value: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Sequence", sequenceSchema);
