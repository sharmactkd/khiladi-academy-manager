import mongoose from "mongoose";

const studentGuardianSchema = new mongoose.Schema(
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
    guardianUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guardian user is required"],
      index: true,
    },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "self", "other"],
      default: "guardian",
    },
    canViewAttendance: {
      type: Boolean,
      default: true,
    },
    canViewFees: {
      type: Boolean,
      default: true,
    },
    canViewProgress: {
      type: Boolean,
      default: true,
    },
    canViewDocuments: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

studentGuardianSchema.index(
  { academy: 1, student: 1, guardianUser: 1 },
  { unique: true }
);
studentGuardianSchema.index({ academy: 1, guardianUser: 1 });
studentGuardianSchema.index({ academy: 1, student: 1 });
studentGuardianSchema.index({ academy: 1, isActive: 1 });

const StudentGuardian = mongoose.model(
  "StudentGuardian",
  studentGuardianSchema
);

export default StudentGuardian;