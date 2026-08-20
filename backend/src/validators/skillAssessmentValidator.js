import { body, param, query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const skillAssessmentIdValidator = [
  param("id").custom((value) => {
    if (!isValidObjectId(value)) {
      throw new Error("Invalid skill assessment id");
    }
    return true;
  }),
];

export const studentSkillProfileValidator = [
  param("studentId").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid student id");
    return true;
  }),
];

export const listSkillAssessmentsValidator = [
  query("branch")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid branch id");
      return true;
    }),

  query("student")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid student id");
      return true;
    }),

  query("skill")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid skill id");
      return true;
    }),

  query("fromDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fromDate must be valid date"),

  query("toDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("toDate must be valid date"),
  query("category").optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  query("status").optional({ checkFalsy: true }).isIn(["draft", "published"]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
];

export const createSkillAssessmentValidator = [
  body("student")
    .notEmpty()
    .withMessage("Student is required")
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid student id");
      return true;
    }),

  body("skill")
    .notEmpty()
    .withMessage("Skill is required")
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid skill id");
      return true;
    }),

  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .isFloat({ min: 0 })
    .withMessage("Score must be 0 or higher"),

  body("maxScore")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Max score must be at least 1"),

  body("assessmentDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Assessment date must be valid"),

  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("status").optional().isIn(["draft", "published"]),
  body("rubricScores").optional().isArray({ max: 12 }),
  body("strengths").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("improvementAreas").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("trainingRecommendation").optional({ checkFalsy: true }).trim().isLength({ max: 800 }),
  body("nextReviewDate").optional({ checkFalsy: true }).isISO8601(),
];

export const updateSkillAssessmentValidator = [
  ...skillAssessmentIdValidator,

  body("score")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Score must be 0 or higher"),

  body("maxScore")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Max score must be at least 1"),

  body("assessmentDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Assessment date must be valid"),

  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("status").optional().isIn(["draft", "published"]),
  body("rubricScores").optional().isArray({ max: 12 }),
  body("strengths").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("improvementAreas").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("trainingRecommendation").optional({ checkFalsy: true }).trim().isLength({ max: 800 }),
  body("nextReviewDate").optional({ checkFalsy: true }).isISO8601(),
];
