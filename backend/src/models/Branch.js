import mongoose from "mongoose";

const phoneNumberSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: [10, "Country code cannot exceed 10 characters"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const additionalCoachSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Coach name cannot exceed 120 characters"],
    },
    countryCode: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: [10, "Coach country code cannot exceed 10 characters"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    achievements: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Coach achievements cannot exceed 1000 characters"],
    },
  },
  { _id: false }
);

const branchSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    directorName: {
      type: String,
      trim: true,
      maxlength: [120, "Director name cannot exceed 120 characters"],
      default: "",
    },
    branchName: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      minlength: [2, "Branch name must be at least 2 characters"],
      maxlength: [120, "Branch name cannot exceed 120 characters"],
    },
    branchCode: {
      type: String,
      required: [true, "Branch code is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Branch code must be at least 2 characters"],
      maxlength: [30, "Branch code cannot exceed 30 characters"],
    },
    countryCode: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: [10, "Country code cannot exceed 10 characters"],
    },
    phone: { type: String, trim: true, default: "" },
    phoneNumbers: { type: [phoneNumberSchema], default: [] },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    city: { type: String, trim: true, default: "", index: true },
    state: { type: String, trim: true, default: "", index: true },
    country: { type: String, trim: true, default: "India" },
    currencyCode: { type: String, trim: true, uppercase: true, default: "INR", minlength: 3, maxlength: 3 },
    currencySymbol: { type: String, trim: true, default: "₹", maxlength: 12 },
    currencyCountryCode: { type: String, trim: true, uppercase: true, default: "IN", minlength: 2, maxlength: 2 },
    headCoachName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Head coach name cannot exceed 120 characters"],
    },
    headCoachCountryCode: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: [10, "Head coach country code cannot exceed 10 characters"],
    },
    headCoachPhone: { type: String, trim: true, default: "" },
    headCoachAchievements: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Head coach achievements cannot exceed 1000 characters"],
    },
    assistantCoachName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Assistant coach name cannot exceed 120 characters"],
    },
    assistantCoachCountryCode: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: [10, "Assistant coach country code cannot exceed 10 characters"],
    },
    assistantCoachPhone: { type: String, trim: true, default: "" },
    assistantCoachAchievements: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Assistant coach achievements cannot exceed 1000 characters"],
    },
    additionalCoaches: { type: [additionalCoachSchema], default: [] },
    branchSince: {
      type: Number,
      default: null,
      min: [1900, "Branch since year must be valid"],
      max: [new Date().getFullYear(), "Branch since cannot be in the future"],
    },
    facilities: { type: [String], default: [] },
    customFacilities: { type: [String], default: [] },
    languagesSpoken: { type: [String], default: [] },
    customLanguages: { type: [String], default: [] },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    coaches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isMainBranch: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
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

branchSchema.index({ academy: 1, branchCode: 1 }, { unique: true });
branchSchema.index({ academy: 1, branchName: 1 });
branchSchema.index({ academy: 1, city: 1, state: 1 });
branchSchema.index({ academy: 1, isActive: 1 });

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const formatIndianPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length !== 10) return String(value || "").trim();
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

branchSchema.pre("validate", function () {
  if (this.branchSince === "" || this.branchSince === undefined) {
    this.branchSince = null;
  }

  this.facilities = [...new Set(normalizeStringArray(this.facilities))];
  this.customFacilities = [...new Set(normalizeStringArray(this.customFacilities))];
  this.languagesSpoken = [...new Set(normalizeStringArray(this.languagesSpoken))];
  this.customLanguages = [...new Set(normalizeStringArray(this.customLanguages))];
});

branchSchema.pre("save", function () {
  if (this.countryCode === "+91" && this.phone) {
    this.phone = formatIndianPhone(this.phone);
  }

  if (Array.isArray(this.phoneNumbers)) {
    this.phoneNumbers = this.phoneNumbers.slice(0, 4).map((item, index) => ({
      countryCode: item.countryCode || "+91",
      phone:
        item.countryCode === "+91" && item.phone
          ? formatIndianPhone(item.phone)
          : item.phone || "",
      isPrimary: index === 0,
    }));
  }

  if (this.headCoachCountryCode === "+91" && this.headCoachPhone) {
    this.headCoachPhone = formatIndianPhone(this.headCoachPhone);
  }

  if (this.assistantCoachCountryCode === "+91" && this.assistantCoachPhone) {
    this.assistantCoachPhone = formatIndianPhone(this.assistantCoachPhone);
  }

  if (Array.isArray(this.additionalCoaches)) {
    this.additionalCoaches = this.additionalCoaches.map((coach) => ({
      name: coach.name || "",
      countryCode: coach.countryCode || "+91",
      phone:
        coach.countryCode === "+91" && coach.phone
          ? formatIndianPhone(coach.phone)
          : coach.phone || "",
      achievements: coach.achievements || "",
    }));
  }
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
