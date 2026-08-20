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

    status: { type: String, enum: ["draft", "published"], default: "published", index: true },
    rubricScores: [{ criterion: { type: String, trim: true, required: true }, weight: { type: Number, min: 1, max: 100 }, score: { type: Number, min: 0 }, maxScore: { type: Number, min: 1, default: 10 } }],
    percentage: { type: Number, min: 0, max: 100, default: 0, index: true },
    grade: { type: String, trim: true, default: "" },
    strengths: { type: String, trim: true, default: "", maxlength: 500 },
    improvementAreas: { type: String, trim: true, default: "", maxlength: 500 },
    trainingRecommendation: { type: String, trim: true, default: "", maxlength: 800 },
    nextReviewDate: { type: Date, default: null, index: true },
    skillSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deleteReason: { type: String, trim: true, default: "", maxlength: 300 },

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

skillAssessmentSchema.pre("validate", function calculateAssessment() {
  this.percentage = this.maxScore > 0 ? Math.round((Number(this.score || 0) / Number(this.maxScore)) * 10000) / 100 : 0;
  if (!this.grade) this.grade = this.percentage >= 90 ? "Excellent" : this.percentage >= 75 ? "Very Good" : this.percentage >= 60 ? "Good" : this.percentage >= 40 ? "Developing" : "Needs Attention";
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
