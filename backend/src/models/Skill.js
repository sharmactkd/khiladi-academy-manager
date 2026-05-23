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

    category: {
      type: String,
      enum: [
        "technique",
        "poomsae",
        "sparring",
        "fitness",
        "discipline",
        "flexibility",
        "other",
      ],
      default: "other",
      index: true,
    },

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

skillSchema.index({
  academy: 1,
  category: 1,
  level: 1,
});

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;