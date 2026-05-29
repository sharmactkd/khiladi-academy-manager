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

    martialArt: {
      type: String,
      trim: true,
      default: "Taekwondo",
    },

    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

    feeDueDay: {
      type: Number,
      default: 10,
      min: [1, "Fee due day must be between 1 and 31"],
      max: [31, "Fee due day must be between 1 and 31"],
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

batchSchema.index({
  academy: 1,
  branch: 1,
});

batchSchema.index({
  academy: 1,
  batchName: 1,
});

batchSchema.index({
  academy: 1,
  isActive: 1,
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;