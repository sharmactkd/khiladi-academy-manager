import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
      index: true,
    },

    martialArt: {
      type: String,
      trim: true,
      required: true,
      default: "Taekwondo",
      index: true,
    },

    skillName: {
      type: String,
      trim: true,
      required: true,
      minlength: [2, "Skill name must be at least 2 characters"],
      maxlength: [120, "Skill name cannot exceed 120 characters"],
    },

    normalizedName: { type: String, trim: true, lowercase: true, default: "", index: true },
    skillCode: { type: String, trim: true, uppercase: true, default: "", maxlength: 30 },
    description: { type: String, trim: true, default: "", maxlength: 600 },

    category: {
      type: String,
      enum: [
        "technique",
        "kicks",
        "blocks",
        "stances",
        "hand_techniques",
        "self_defence",
        "poomsae",
        "sparring",
        "fitness",
        "flexibility",
        "strength",
        "stamina",
        "speed",
        "agility",
        "balance",
        "coordination",
        "discipline",
        "other",
      ],
      default: "other",
      index: true,
    },

    targetBelts: [{ type: String, trim: true }],
    targetDans: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, maxlength: 40 }],
    isRequired: { type: Boolean, default: false },
    maxScore: { type: Number, default: 10, min: 1, max: 100 },
    assessmentIntervalDays: { type: Number, default: 90, min: 1, max: 730 },
    displayOrder: { type: Number, default: 0, min: 0 },
    rubric: [{ criterion: { type: String, trim: true, required: true, maxlength: 80 }, weight: { type: Number, min: 1, max: 100, required: true } }],
    version: { type: Number, default: 1, min: 1 },
    archivedAt: { type: Date, default: null },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "black_belt", "all"],
      default: "all",
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

skillSchema.index({
  academy: 1,
  martialArt: 1,
  skillName: 1,
});

skillSchema.index(
  { academy: 1, martialArt: 1, normalizedName: 1 },
  { unique: true, partialFilterExpression: { normalizedName: { $type: "string" } } }
);

skillSchema.pre("validate", function normalizeSkill() {
  this.normalizedName = String(this.skillName || "").trim().toLowerCase().replace(/\s+/g, " ");
  this.skillCode = String(this.skillCode || "").trim().toUpperCase();
  if (Array.isArray(this.rubric) && this.rubric.length) {
    const totalWeight = this.rubric.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    if (totalWeight !== 100) this.invalidate("rubric", "Rubric weights must total 100");
  }
});

skillSchema.index({
  academy: 1,
  category: 1,
  level: 1,
});

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
