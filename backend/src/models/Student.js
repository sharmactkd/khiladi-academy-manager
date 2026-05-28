import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    relation: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

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
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
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

studentSchema.index(
  {
    academy: 1,
    admissionNumber: 1,
  },
  {
    unique: true,
  }
);

studentSchema.index({
  academy: 1,
  branch: 1,
});

studentSchema.index({
  academy: 1,
  batch: 1,
});

studentSchema.index({
  academy: 1,
  status: 1,
});

studentSchema.pre("save", function () {
  if (this.phone) {
    this.phone = String(this.phone).replace(/\D/g, "").slice(0, 10);
  }

  if (this.emergencyContact?.phone) {
    this.emergencyContact.phone = String(this.emergencyContact.phone)
      .replace(/\D/g, "")
      .slice(0, 10);
  }
});

const Student = mongoose.model("Student", studentSchema);

export default Student;