import { body, param, query } from "express-validator";

export const timelineStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createStudentTimelineValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Timeline title is required")
    .isLength({ max: 150 })
    .withMessage("Title cannot exceed 150 characters"),

  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("date")
    .notEmpty()
    .withMessage("Timeline date is required")
    .isISO8601()
    .withMessage("Timeline date must be valid"),
];

export const listStudentTimelineValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
  query("type")
    .optional({ checkFalsy: true })
    .isIn([
      "joined",
      "belt_test",
      "belt_promoted",
      "championship",
      "medal",
      "fee_paid",
      "attendance",
      "certificate",
      "id_card",
      "note",
    ]),
  query("limit").optional().isInt({ min: 1, max: 200 }),
];