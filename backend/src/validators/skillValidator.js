import { body, param, query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const skillIdValidator = [
  param("id").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid skill id");
    return true;
  }),
];

export const listSkillsValidator = [
  query("martialArt").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),

  query("category")
    .optional({ checkFalsy: true })
    .isIn([
      "technique",
      "poomsae",
      "sparring",
      "fitness",
      "discipline",
      "flexibility",
      "other",
    ])
    .withMessage("Invalid skill category"),

  query("level")
    .optional({ checkFalsy: true })
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  query("status")
    .optional({ checkFalsy: true })
    .isIn(["active", "inactive", "all"])
    .withMessage("Invalid status"),
];

export const createSkillValidator = [
  body("martialArt")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Martial art cannot exceed 80 characters"),

  body("skillName")
    .trim()
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Skill name must be 2 to 120 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "technique",
      "poomsae",
      "sparring",
      "fitness",
      "discipline",
      "flexibility",
      "other",
    ])
    .withMessage("Invalid skill category"),

  body("level")
    .optional({ checkFalsy: true })
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  body("isActive").optional().isBoolean(),
];

export const updateSkillValidator = [
  ...skillIdValidator,

  body("martialArt")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Martial art cannot exceed 80 characters"),

  body("skillName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Skill name must be 2 to 120 characters"),

  body("category")
    .optional()
    .isIn([
      "technique",
      "poomsae",
      "sparring",
      "fitness",
      "discipline",
      "flexibility",
      "other",
    ])
    .withMessage("Invalid skill category"),

  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  body("isActive").optional().isBoolean(),
];