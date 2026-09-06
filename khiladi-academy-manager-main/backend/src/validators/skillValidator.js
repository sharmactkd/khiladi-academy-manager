import { body, param, query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const SKILL_CATEGORIES = ["technique", "kicks", "blocks", "stances", "hand_techniques", "self_defence", "poomsae", "sparring", "fitness", "flexibility", "strength", "stamina", "speed", "agility", "balance", "coordination", "discipline", "other"];

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
    .isIn(SKILL_CATEGORIES)
    .withMessage("Invalid skill category"),

  query("level")
    .optional({ checkFalsy: true })
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  query("status")
    .optional({ checkFalsy: true })
    .isIn(["active", "inactive", "all"])
    .withMessage("Invalid status"),
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
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
    .isIn(SKILL_CATEGORIES)
    .withMessage("Invalid skill category"),

  body("level")
    .optional({ checkFalsy: true })
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  body("isActive").optional().isBoolean(),
  body("skillCode").optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 600 }),
  body("targetBelts").optional().isArray({ max: 20 }),
  body("targetDans").optional().isArray({ max: 15 }),
  body("tags").optional().isArray({ max: 20 }),
  body("isRequired").optional().isBoolean(),
  body("maxScore").optional().isFloat({ min: 1, max: 100 }),
  body("assessmentIntervalDays").optional().isInt({ min: 1, max: 730 }),
  body("displayOrder").optional().isInt({ min: 0 }),
  body("rubric").optional().isArray({ max: 12 }),
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
    .isIn(SKILL_CATEGORIES)
    .withMessage("Invalid skill category"),

  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "black_belt", "all"])
    .withMessage("Invalid skill level"),

  body("isActive").optional().isBoolean(),
  body("skillCode").optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 600 }),
  body("targetBelts").optional().isArray({ max: 20 }),
  body("targetDans").optional().isArray({ max: 15 }),
  body("tags").optional().isArray({ max: 20 }),
  body("isRequired").optional().isBoolean(),
  body("maxScore").optional().isFloat({ min: 1, max: 100 }),
  body("assessmentIntervalDays").optional().isInt({ min: 1, max: 730 }),
  body("displayOrder").optional().isInt({ min: 0 }),
  body("rubric").optional().isArray({ max: 12 }),
];
