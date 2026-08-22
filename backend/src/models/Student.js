import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relation: { type: String, trim: true, default: "" },
    countryCode: { type: String, trim: true, default: "+91" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const personContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150, default: "" },
    relation: { type: String, trim: true, maxlength: 80, default: "" },
    countryCode: { type: String, trim: true, default: "+91" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    schoolName: { type: String, trim: true, maxlength: 200, default: "" },
    className: { type: String, trim: true, maxlength: 80, default: "" },
    section: { type: String, trim: true, maxlength: 40, default: "" },
    collegeName: { type: String, trim: true, maxlength: 200, default: "" },
    occupation: { type: String, trim: true, maxlength: 150, default: "" },
  },
  { _id: false }
);

const physicalInfoSchema = new mongoose.Schema(
  {
    heightCm: { type: Number, default: null, min: 0 },
    weightKg: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const medicalInfoSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    medicalConditions: { type: [String], default: [] },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const getAgeCategory = (age) => {
  if (age === null || age === undefined) return "";

  if (age <= 11) return "Sub-Junior";
  if (age <= 14) return "Cadet";
  if (age <= 17) return "Junior";
  return "Senior";
};

const studentSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    admissionNumber: {
      type: String,
      trim: true,
      required: true,
    },

    aadhaarNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 12,
    },

    firstName: {
      type: String,
      trim: true,
      required: true,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    profileStatus: {
      type: String,
      enum: ["complete", "incomplete"],
      default: "complete",
      index: true,
    },

    profileIncompleteFields: { type: [String], default: [] },

    importSource: {
      type: String,
      enum: ["manual", "excel-record", "excel-attendance"],
      default: "manual",
    },

    legacySourceSheets: { type: [String], default: [] },

    age: {
      type: Number,
      default: null,
      min: 0,
    },

    ageCategory: {
      type: String,
      trim: true,
      default: "",
      enum: ["", "Sub-Junior", "Cadet", "Junior", "Senior", "Under-14", "Under-17", "Under-19"],
      index: true,
    },

    countryCode: {
      type: String,
      trim: true,
      default: "+91",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    parentName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    parentCountryCode: {
      type: String,
      trim: true,
      default: "+91",
    },

    parentPhone: {
      type: String,
      trim: true,
      default: "",
    },

    parentContacts: {
      type: [personContactSchema],
      default: [],
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    education: {
      type: educationSchema,
      default: () => ({}),
    },

    schoolName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    className: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    section: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },

    collegeName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    occupation: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    martialArt: {
      type: String,
      trim: true,
      default: "Taekwondo",
      index: true,
    },

    beltRank: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    danRank: {
      type: String,
      trim: true,
      default: "",
      enum: ["", "1st Dan", "2nd Dan", "3rd Dan", "4th Dan", "5th Dan", "6th Dan", "7th Dan", "8th Dan", "9th Dan", "10th Dan"],
    },

    physicalInfo: {
      type: physicalInfoSchema,
      default: () => ({}),
    },

    heightCm: {
      type: Number,
      default: null,
      min: 0,
    },

    weightKg: {
      type: Number,
      default: null,
      min: 0,
    },

    medicalInfo: {
      type: medicalInfoSchema,
      default: () => ({}),
    },

    bloodGroup: {
      type: String,
      trim: true,
      default: "",
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    medicalConditions: {
      type: [String],
      default: [],
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "left"],
      default: "active",
      index: true,
    },

    statusUpdatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    monthlyFeeOverride: {
      type: Number,
      default: null,
      min: [0, "Monthly fee override cannot be negative"],
    },

    feeDueDay: {
      type: Number,
      default: null,
      min: [1, "Fee due day must be between 1 and 31"],
      max: [31, "Fee due day must be between 1 and 31"],
    },

    scholarshipAmount: {
      type: Number,
      default: 0,
      min: [0, "Scholarship amount cannot be negative"],
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount percent cannot be negative"],
      max: [100, "Discount percent cannot exceed 100"],
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },

    emergencyContacts: {
      type: [personContactSchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

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
  {
    timestamps: true,
  }
);

studentSchema.index({ academy: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ academy: 1, aadhaarNumber: 1 });
studentSchema.index({ academy: 1, branch: 1 });
studentSchema.index({ academy: 1, batch: 1 });
studentSchema.index({ academy: 1, status: 1 });
studentSchema.index({ academy: 1, ageCategory: 1 });
studentSchema.index({ academy: 1, profileStatus: 1 });
studentSchema.index({ academy: 1, phone: 1 });

const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);

const cleanNumberOrNull = (value) => {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((item) => String(item || "").trim()).filter(Boolean))];
      }
    } catch {
      return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
    }
  }

  return [];
};

studentSchema.pre("validate", function () {
  this.aadhaarNumber = String(this.aadhaarNumber || "").replace(/\D/g, "").slice(0, 12);

  this.age = calculateAge(this.dateOfBirth);
  if (!this.ageCategory || (this.isModified("dateOfBirth") && !this.isModified("ageCategory"))) {
    this.ageCategory = getAgeCategory(this.age);
  }

  this.profileIncompleteFields = normalizeArray(this.profileIncompleteFields);
  this.legacySourceSheets = normalizeArray(this.legacySourceSheets);

  if (this.profileStatus === "complete" && !this.dateOfBirth) {
    this.invalidate("dateOfBirth", "Date of birth is required for a complete profile");
  }

  if (this.profileStatus === "incomplete" && !this.profileIncompleteFields.length) {
    this.profileIncompleteFields = ["dateOfBirth"];
  }

  this.heightCm = cleanNumberOrNull(this.heightCm);
  this.weightKg = cleanNumberOrNull(this.weightKg);

  this.physicalInfo = {
    heightCm: this.heightCm,
    weightKg: this.weightKg,
  };

  this.medicalConditions = normalizeArray(this.medicalConditions);

  this.medicalInfo = {
    bloodGroup: this.bloodGroup || "",
    medicalConditions: this.medicalConditions,
    notes: this.notes || "",
  };

  this.education = {
    schoolName: this.schoolName || "",
    className: this.className || "",
    section: this.section || "",
    collegeName: this.collegeName || "",
    occupation: this.occupation || "",
  };

  if (String(this.beltRank || "").toLowerCase() !== "black") {
    this.danRank = "";
  }
});

studentSchema.pre("save", function () {
  if (this.phone) this.phone = cleanPhone(this.phone);
  if (this.parentPhone) this.parentPhone = cleanPhone(this.parentPhone);

  if (this.emergencyContact?.phone) {
    this.emergencyContact.phone = cleanPhone(this.emergencyContact.phone);
  }
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
