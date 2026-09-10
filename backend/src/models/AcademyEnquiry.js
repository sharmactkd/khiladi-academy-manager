import crypto from "crypto";
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ["created", "status_changed", "follow_up_set", "trial_scheduled", "converted", "note_updated", "communication_sent"], required: true },
  from: { type: String, trim: true, default: "" },
  to: { type: String, trim: true, default: "" },
  at: { type: Date, default: Date.now },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { _id: false });

const communicationSchema = new mongoose.Schema({
  channel: { type: String, enum: ["whatsapp", "phone", "email"], required: true },
  template: { type: String, trim: true, maxlength: 80, default: "" },
  message: { type: String, trim: true, maxlength: 1200, default: "" },
  sentAt: { type: Date, default: Date.now },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { _id: false });

const academyEnquirySchema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, index: true, select: false },
  publicProfile: { type: mongoose.Schema.Types.ObjectId, ref: "PublicAcademyProfile", required: true, index: true, select: false },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  email: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
  studentAge: { type: Number, min: 3, max: 100, default: null },
  martialArt: { type: String, trim: true, maxlength: 80, default: "" },
  branchName: { type: String, trim: true, maxlength: 120, default: "" },
  message: { type: String, trim: true, maxlength: 600, default: "" },
  requestType: { type: String, enum: ["general", "trial_class", "admission"], default: "trial_class", index: true },
  preferredDate: { type: Date, default: null },
  consentToContact: { type: Boolean, required: true },
  status: { type: String, enum: ["new", "contacted", "trial_scheduled", "trial_completed", "converted", "closed"], default: "new", index: true },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal", index: true },
  followUpAt: { type: Date, default: null, index: true },
  trialSchedule: {
    date: { type: Date, default: null },
    startTime: { type: String, trim: true, maxlength: 8, default: "" },
    endTime: { type: String, trim: true, maxlength: 8, default: "" },
    branchName: { type: String, trim: true, maxlength: 120, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  convertedStudent: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null, index: true },
  convertedAt: { type: Date, default: null },
  ownerNotes: { type: String, trim: true, maxlength: 1500, default: "", select: false },
  fingerprint: { type: String, required: true, select: false },
  source: { type: String, enum: ["public_directory"], default: "public_directory" },
  lastContactedAt: { type: Date, default: null },
  activity: { type: [activitySchema], default: () => [{ type: "created", at: new Date() }], select: false },
  communications: { type: [communicationSchema], default: [], select: false },
}, { timestamps: true });

academyEnquirySchema.index({ academy: 1, status: 1, createdAt: -1 });
academyEnquirySchema.index({ academy: 1, followUpAt: 1, status: 1 });
academyEnquirySchema.index({ academy: 1, fingerprint: 1, createdAt: -1 });
academyEnquirySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export const enquiryFingerprint = ({ academyId, phone, ip }) => crypto.createHash("sha256")
  .update(`${academyId}|${String(phone).replace(/\D/g, "")}|${ip || ""}`)
  .digest("hex");

export default mongoose.model("AcademyEnquiry", academyEnquirySchema);
