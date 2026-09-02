import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true, maxlength: 255 },
  fileHash: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  mode: { type: String, enum: ["students", "attendance", "both"], required: true },
  status: { type: String, enum: ["ready", "importing", "paused", "completed", "partial", "failed"], default: "ready" },
  plan: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const ImportSession = mongoose.model("ImportSession", sessionSchema);

const chunkSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: "ImportSession", required: true },
  key: { type: String, required: true },
  hash: { type: String, required: true },
  status: { type: String, enum: ["running", "done"], required: true },
  httpStatus: Number,
  response: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
chunkSchema.index({ session: 1, key: 1 }, { unique: true });
export const ImportChunk = mongoose.model("ImportChunk", chunkSchema);
