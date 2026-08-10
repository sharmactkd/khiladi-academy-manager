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

const phoneNumberSchema = new mongoose.Schema(
  {
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
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
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
      default: [],
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

    phoneNumbers: {
      type: [phoneNumberSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 4;
        },
        message: "Maximum 4 phone numbers are allowed",
      },
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

  const sourcePhones = Array.isArray(this.phoneNumbers)
    ? this.phoneNumbers.slice(0, 4)
    : [];

  const normalizedPhones = sourcePhones
    .map((item, index) => ({
      countryCode: String(item?.countryCode || "+91").trim() || "+91",
      phone: String(item?.phone || "").trim(),
      isPrimary: index === 0,
    }))
    .filter((item, index) => index === 0 || item.phone);

  if (!normalizedPhones.length && (this.phone || this.countryCode)) {
    normalizedPhones.push({
      countryCode: this.countryCode || "+91",
      phone: this.phone || "",
      isPrimary: true,
    });
  }

  this.phoneNumbers = normalizedPhones;

  if (normalizedPhones[0]) {
    this.countryCode = normalizedPhones[0].countryCode;
    this.phone = normalizedPhones[0].phone;
  }

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
  const formatIndianPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
    return digits.length === 10
      ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
      : String(value || "").trim();
  };

  this.phoneNumbers = (this.phoneNumbers || []).map((item, index) => ({
    countryCode: item.countryCode || "+91",
    phone:
      item.countryCode === "+91"
        ? formatIndianPhone(item.phone)
        : String(item.phone || "").trim(),
    isPrimary: index === 0,
  }));

  if (this.phoneNumbers[0]) {
    this.countryCode = this.phoneNumbers[0].countryCode;
    this.phone = this.phoneNumbers[0].phone;
  }
});

const Academy = mongoose.model("Academy", academySchema);

export default Academy;