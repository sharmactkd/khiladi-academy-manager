import mongoose from "mongoose";

const beltTestSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },
    currentBelt: {
      type: String,
      required: [true, "Current belt is required"],
      trim: true,
    },
    promotedToBelt: {
      type: String,
      required: [true, "Promoted belt is required"],
      trim: true,
    },
    testDate: {
      type: Date,
      required: [true, "Test date is required"],
      index: true,
    },
    result: {
      type: String,
      enum: ["pass", "fail", "pending"],
      default: "pending",
      index: true,
    },
    examinerName: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    certificateNumber: {
      type: String,
      trim: true,
      default: "",
    },
    certificateUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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
  { timestamps: true }
);

beltTestSchema.index({ academy: 1, student: 1 });
beltTestSchema.index({ academy: 1, testDate: -1 });
beltTestSchema.index({ academy: 1, result: 1 });
beltTestSchema.index(
  { academy: 1, certificateNumber: 1 },
  {
    sparse: true,
    partialFilterExpression: {
      certificateNumber: { $type: "string", $ne: "" },
    },
  }
);
beltTestSchema.index({ academy: 1, isDeleted: 1 });

const BeltTest = mongoose.model("BeltTest", beltTestSchema);

export default BeltTest;