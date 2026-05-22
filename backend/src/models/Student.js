import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },
    studentCode: {
      type: String,
      required: [true, "Student code is required"],
      trim: true,
      uppercase: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    photo: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    dob: {
      type: Date,
      default: null,
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
      default: "",
    },
    parentPhone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Address cannot exceed 500 characters"],
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
      default: "",
    },
    beltRank: {
      type: String,
      trim: true,
      default: "",
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
    medicalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContactPhone: {
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
  { timestamps: true }
);

studentSchema.index({ academy: 1, studentCode: 1 }, { unique: true });
studentSchema.index({ academy: 1, name: 1 });
studentSchema.index({ academy: 1, phone: 1 });
studentSchema.index({ academy: 1, status: 1 });
studentSchema.index({ academy: 1, batch: 1 });

const Student = mongoose.model("Student", studentSchema);

export default Student;