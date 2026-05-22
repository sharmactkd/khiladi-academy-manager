import { body, param, query } from "express-validator";

export const studentIdValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),
];

export const createStudentValidator = [
  body("studentCode")
    .trim()
    .notEmpty()
    .withMessage("Student code is required")
    .isLength({ max: 40 })
    .withMessage("Student code cannot exceed 40 characters"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Student name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Student name must be between 2 and 100 characters"),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("dob").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("parentPhone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const updateStudentValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),
  body("studentCode").optional().trim().notEmpty(),
  body("name").optional().trim().isLength({ min: 2, max: 100 }),
  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("dob").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const listStudentsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(["active", "inactive", "left"]),
  query("batch").optional({ checkFalsy: true }).isMongoId(),
];