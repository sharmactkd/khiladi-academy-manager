import mongoose from "mongoose";

const skillAssessmentSchema = new mongoose.Schema(
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

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },

    assessmentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Remarks cannot exceed 500 characters"],
    },

    assessedBy: {
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
  {
    timestamps: true,
  }
);

skillAssessmentSchema.index({
  academy: 1,
  branch: 1,
  student: 1,
});

skillAssessmentSchema.index({
  academy: 1,
  skill: 1,
  assessmentDate: -1,
});

const SkillAssessment = mongoose.model(
  "SkillAssessment",
  skillAssessmentSchema
);

export default SkillAssessment;