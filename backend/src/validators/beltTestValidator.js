import { body, param, query } from "express-validator";

const DAN_RANKS = [
  "1st Dan", "2nd Dan", "3rd Dan", "4th Dan", "5th Dan",
  "6th Dan", "7th Dan", "8th Dan", "9th Dan", "10th Dan",
];

const validateDanPromotion = (payload) => {
  if (payload.currentBelt !== "Black" || payload.promotedToBelt !== "Black") return true;
  const currentIndex = DAN_RANKS.indexOf(payload.currentDanRank);
  const promotedIndex = DAN_RANKS.indexOf(payload.promotedToDanRank);
  if (currentIndex < 0 || promotedIndex <= currentIndex) {
    throw new Error("Promoted Dan rank must be higher than current Dan rank");
  }
  return true;
};

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

  body("currentDanRank")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Current Dan rank cannot exceed 40 characters"),

  body("promotedToDanRank")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Promoted Dan rank cannot exceed 40 characters"),

  body("marks")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Marks cannot be negative"),

  body("outOf")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0.01 })
    .withMessage("Total marks must be greater than zero"),

  body().custom((_, { req }) => {
    if (req.body.marks === null || req.body.marks === "" || req.body.marks === undefined) return true;
    if (req.body.outOf === null || req.body.outOf === "" || req.body.outOf === undefined) return true;
    if (Number(req.body.marks) > Number(req.body.outOf)) {
      throw new Error("Marks obtained cannot exceed total marks");
    }
    return true;
  }),

  body().custom((_, { req }) => validateDanPromotion(req.body)),

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
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Certificate URL must use http or https")
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

  body("currentDanRank").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),

  body("promotedToDanRank").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),

  body("marks").optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),

  body("outOf").optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0.01 }),

  body().custom((_, { req }) => {
    if (req.body.marks === null || req.body.marks === "" || req.body.marks === undefined) return true;
    if (req.body.outOf === null || req.body.outOf === "" || req.body.outOf === undefined) return true;
    if (Number(req.body.marks) > Number(req.body.outOf)) {
      throw new Error("Marks obtained cannot exceed total marks");
    }
    return true;
  }),

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

  body("certificateUrl").optional({ checkFalsy: true }).trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Certificate URL must use http or https").isLength({
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
