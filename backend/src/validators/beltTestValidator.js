import { body, param, query } from "express-validator";

export const beltTestIdValidator = [
  param("id").isMongoId().withMessage("Invalid belt test ID"),
];

export const beltTestStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createBeltTestValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("currentBelt")
    .trim()
    .notEmpty()
    .withMessage("Current belt is required")
    .isLength({ max: 80 })
    .withMessage("Current belt cannot exceed 80 characters"),

  body("promotedToBelt")
    .trim()
    .notEmpty()
    .withMessage("Promoted belt is required")
    .isLength({ max: 80 })
    .withMessage("Promoted belt cannot exceed 80 characters"),

  body("testDate")
    .notEmpty()
    .withMessage("Test date is required")
    .isISO8601()
    .withMessage("Test date must be valid"),

  body("result")
    .optional()
    .isIn(["pass", "fail", "pending"])
    .withMessage("Result must be pass, fail, or pending"),

  body("examinerName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Examiner name cannot exceed 100 characters"),

  body("remarks")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Remarks cannot exceed 1000 characters"),

  body("certificateNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Certificate number cannot exceed 80 characters"),

  body("certificateUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Certificate URL cannot exceed 500 characters"),
];

export const updateBeltTestValidator = [
  param("id").isMongoId().withMessage("Invalid belt test ID"),

  body("student").optional().isMongoId().withMessage("Invalid student ID"),

  body("currentBelt")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Current belt cannot be empty")
    .isLength({ max: 80 }),

  body("promotedToBelt")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Promoted belt cannot be empty")
    .isLength({ max: 80 }),

  body("testDate")
    .optional()
    .isISO8601()
    .withMessage("Test date must be valid"),

  body("result")
    .optional()
    .isIn(["pass", "fail", "pending"])
    .withMessage("Result must be pass, fail, or pending"),

  body("examinerName").optional({ checkFalsy: true }).trim().isLength({
    max: 100,
  }),

  body("remarks").optional({ checkFalsy: true }).trim().isLength({
    max: 1000,
  }),

  body("certificateNumber").optional({ checkFalsy: true }).trim().isLength({
    max: 80,
  }),

  body("certificateUrl").optional({ checkFalsy: true }).trim().isLength({
    max: 500,
  }),
];

export const listBeltTestsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("student").optional({ checkFalsy: true }).isMongoId(),
  query("result").optional({ checkFalsy: true }).isIn(["pass", "fail", "pending"]),
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query("fromDate").optional({ checkFalsy: true }).isISO8601(),
  query("toDate").optional({ checkFalsy: true }).isISO8601(),
];