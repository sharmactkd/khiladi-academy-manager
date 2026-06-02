import mongoose from "mongoose";

const academySettingsSchema = new mongoose.Schema(
  {
    allowParentPortal: {
      type: Boolean,
      default: false,
    },
    allowOnlineAdmission: {
      type: Boolean,
      default: false,
    },
    defaultCurrency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "Website URL cannot exceed 250 characters"],
    },
    instagram: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "Instagram URL cannot exceed 250 characters"],
    },
    facebook: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "Facebook URL cannot exceed 250 characters"],
    },
    youtube: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "YouTube URL cannot exceed 250 characters"],
    },
  },
  { _id: false }
);

const affiliationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["affiliation", "recognition", "registration"],
      default: "affiliation",
    },
    organizationName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [180, "Organization name cannot exceed 180 characters"],
    },
    registrationNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: [120, "Registration number cannot exceed 120 characters"],
    },
  },
  { _id: true }
);

const academySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Academy owner is required"],
      unique: true,
      index: true,
    },

    ownerName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [120, "Owner name cannot exceed 120 characters"],
    },

    academyName: {
      type: String,
      required: [true, "Academy name is required"],
      trim: true,
      minlength: [2, "Academy name must be at least 2 characters"],
      maxlength: [120, "Academy name cannot exceed 120 characters"],
    },

    martialArts: {
      type: [String],
      required: [true, "At least one martial art is required"],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one martial art is required",
      },
    },

    since: {
      type: Number,
      default: null,
      min: [1900, "Since year must be valid"],
      max: [new Date().getFullYear(), "Since year cannot be in the future"],
    },

    about: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1500, "About academy cannot exceed 1500 characters"],
    },

    affiliations: {
      type: [affiliationSchema],
      default: [],
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    logo: {
      type: String,
      default: "",
      trim: true,
    },

    countryCode: {
      type: String,
      default: "+91",
      trim: true,
      maxlength: [10, "Country code cannot exceed 10 characters"],
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    city: {
      type: String,
      default: "",
      trim: true,
      maxlength: [80, "District cannot exceed 80 characters"],
    },

    state: {
      type: String,
      default: "",
      trim: true,
      maxlength: [80, "State cannot exceed 80 characters"],
    },

    country: {
      type: String,
      default: "India",
      trim: true,
      maxlength: [80, "Country cannot exceed 80 characters"],
    },

    branchesEnabled: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ["free", "trial", "active", "expired", "cancelled"],
      default: "free",
      index: true,
    },

    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "pro", "premium", "enterprise"],
      default: "free",
    },

    maxStudentsAllowed: {
      type: Number,
      default: 50,
      min: [0, "Max students allowed cannot be negative"],
    },

    settings: {
      type: academySettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

academySchema.index({ academyName: "text" });
academySchema.index({ city: 1, state: 1 });

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

academySchema.pre("validate", function () {
  this.martialArts = normalizeStringArray(this.martialArts);

  if (this.since === "" || this.since === undefined) {
    this.since = null;
  }

  if (Array.isArray(this.affiliations)) {
    this.affiliations = this.affiliations
      .map((item) => ({
        type: item?.type || "affiliation",
        organizationName: String(item?.organizationName || "").trim(),
        registrationNumber: String(item?.registrationNumber || "").trim(),
      }))
      .filter((item) => item.organizationName || item.registrationNumber);
  }
});

academySchema.pre("save", function () {
  if (this.countryCode === "+91" && this.phone) {
    const digits = String(this.phone).replace(/\D/g, "").slice(0, 10);

    if (digits.length === 10) {
      this.phone = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(
        6
      )}`;
    }
  }
});

const Academy = mongoose.model("Academy", academySchema);

export default Academy;