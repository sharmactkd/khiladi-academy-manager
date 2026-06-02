import mongoose from "mongoose";

const batchScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
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
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
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

    batchName: {
      type: String,
      trim: true,
      required: true,
    },

    batchCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      maxlength: [40, "Batch code cannot exceed 40 characters"],
    },

    martialArt: {
      type: String,
      trim: true,
      default: "Taekwondo",
    },

    genderGroup: {
  type: String,
  trim: true,
  default: "both",
  enum: ["male", "female", "both"],
},

    batchType: {
      type: String,
      trim: true,
      default: "regular",
      enum: [
        "regular",
        "competition",
        "poomsae",
        "sparring",
        "fitness",
        "kids",
        "adults",
        "black-belt",
        "custom",
      ],
    },

    skillLevel: {
      type: String,
      trim: true,
      default: "beginner",
      enum: ["beginner", "intermediate", "advanced", "elite", "mixed"],
    },

    mode: {
      type: String,
      trim: true,
      default: "offline",
      enum: ["offline", "online", "hybrid"],
    },

    sessionSlot: {
      type: String,
      trim: true,
      default: "",
      enum: ["", "morning", "afternoon", "evening", "night"],
    },

    venue: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Venue cannot exceed 120 characters"],
    },

    batchColor: {
      type: String,
      trim: true,
      default: "",
      maxlength: [30, "Batch color cannot exceed 30 characters"],
    },

    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    headCoachName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Head coach name cannot exceed 120 characters"],
    },

    assistantCoachName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Assistant coach name cannot exceed 120 characters"],
    },

    additionalCoaches: {
      type: [additionalCoachSchema],
      default: [],
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    schedule: {
      type: [batchScheduleSchema],
      default: [],
    },

    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    minAge: {
      type: Number,
      default: null,
      min: [0, "Minimum age cannot be negative"],
    },

    maxAge: {
      type: Number,
      default: null,
      min: [0, "Maximum age cannot be negative"],
    },

    minBelt: {
      type: String,
      trim: true,
      default: "",
    },

    maxBelt: {
      type: String,
      trim: true,
      default: "",
    },

    monthlyFee: {
      type: Number,
      default: 0,
      min: [0, "Monthly fee cannot be negative"],
    },

    quarterlyFee: {
      type: Number,
      default: 0,
      min: [0, "Quarterly fee cannot be negative"],
    },

    annualFee: {
      type: Number,
      default: 0,
      min: [0, "Annual fee cannot be negative"],
    },

    registrationFee: {
      type: Number,
      default: 0,
      min: [0, "Registration fee cannot be negative"],
    },

    uniformFee: {
      type: Number,
      default: 0,
      min: [0, "Uniform fee cannot be negative"],
    },

    examinationFee: {
      type: Number,
      default: 0,
      min: [0, "Examination fee cannot be negative"],
    },

    lateFee: {
      type: Number,
      default: 0,
      min: [0, "Late fee cannot be negative"],
    },

    minimumAttendancePercentage: {
      type: Number,
      default: 75,
      min: [0, "Minimum attendance cannot be negative"],
      max: [100, "Minimum attendance cannot exceed 100"],
    },

    batchLanguage: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappGroupLink: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "WhatsApp group link cannot exceed 300 characters"],
    },

    googleMeetLink: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Google Meet link cannot exceed 300 characters"],
    },

    isCompetitionBatch: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

batchSchema.index({ academy: 1, branch: 1 });
batchSchema.index({ academy: 1, batchName: 1 });
batchSchema.index({ academy: 1, batchCode: 1 });
batchSchema.index({ academy: 1, isActive: 1 });
batchSchema.index({ academy: 1, batchType: 1 });
batchSchema.index({ academy: 1, skillLevel: 1 });

const cleanNumberOrNull = (value) => {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

batchSchema.pre("validate", function () {
  this.minAge = cleanNumberOrNull(this.minAge);
  this.maxAge = cleanNumberOrNull(this.maxAge);

  if (this.batchCode) {
    this.batchCode = String(this.batchCode).trim().toUpperCase();
  }

  if (Array.isArray(this.additionalCoaches)) {
    this.additionalCoaches = this.additionalCoaches
      .map((coach) => ({
        name: String(coach?.name || "").trim(),
        phone: String(coach?.phone || "").trim(),
      }))
      .filter((coach) => coach.name || coach.phone);
  }
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;