import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
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
      index: true,
    },

    state: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    coaches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isMainBranch: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

branchSchema.index({ academy: 1, branchCode: 1 }, { unique: true });
branchSchema.index({ academy: 1, branchName: 1 });
branchSchema.index({ academy: 1, city: 1, state: 1 });
branchSchema.index({ academy: 1, isActive: 1 });

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;