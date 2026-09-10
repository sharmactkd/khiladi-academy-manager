import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 120 },
  address: { type: String, trim: true, maxlength: 300 },
  city: { type: String, trim: true, maxlength: 80 },
  state: { type: String, trim: true, maxlength: 80 },
  martialArts: { type: [String], default: [] },
  facilities: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  isMainBranch: { type: Boolean, default: false },
}, { _id: false });

const publicAcademyProfileSchema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true, unique: true, index: true, select: false },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 140 },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  academyName: { type: String, required: true, trim: true, maxlength: 120 },
  tagline: { type: String, trim: true, maxlength: 180, default: "" },
  about: { type: String, trim: true, maxlength: 2000, default: "" },
  logo: { type: String, trim: true, default: "" },
  coverImage: { type: String, trim: true, default: "" },
  since: { type: Number, min: 1900, max: 2100, default: null },
  martialArts: { type: [String], default: [] },
  highlights: { type: [String], default: [] },
  facilities: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  location: {
    address: { type: String, trim: true, maxlength: 300, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 80, default: "" },
    country: { type: String, trim: true, maxlength: 80, default: "India" },
  },
  contact: {
    countryCode: { type: String, trim: true, maxlength: 10, default: "+91" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
    website: { type: String, trim: true, maxlength: 250, default: "" },
    showPhone: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: false },
  },
  trialAvailable: { type: Boolean, default: false, index: true },
  onlineTraining: { type: Boolean, default: false },
  girlsOnlyBatches: { type: Boolean, default: false },
  feeDisplay: { type: String, enum: ["hidden", "starting", "contact"], default: "contact" },
  startingFee: { type: Number, min: 0, max: 10000000, default: null },
  branches: { type: [branchSchema], default: [] },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

publicAcademyProfileSchema.index({ status: 1, "location.city": 1, academyName: 1 });
publicAcademyProfileSchema.index({ status: 1, martialArts: 1 });
publicAcademyProfileSchema.index({ academyName: "text", tagline: "text", about: "text", martialArts: "text" });

export default mongoose.model("PublicAcademyProfile", publicAcademyProfileSchema);
