import { body, param, query } from "express-validator";

export const championshipRecordIdValidator = [
  param("id").isMongoId().withMessage("Invalid championship record ID"),
];

export const championshipStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createChampionshipRecordValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("championshipName")
    .trim()
    .notEmpty()
    .withMessage("Championship name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Championship name must be between 2 and 150 characters"),

  body("level")
    .optional()
    .isIn(["district", "state", "national", "international", "open"])
    .withMessage("Invalid championship level"),

  body("eventType")
    .optional()
    .isIn(["kyorugi", "poomsae", "demo", "other"])
    .withMessage("Invalid event type"),

  body("ageCategory")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Age category cannot exceed 80 characters"),

  body("weightCategory")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Weight category cannot exceed 80 characters"),

  body("result")
    .optional()
    .isIn(["gold", "silver", "bronze", "participated", "disqualified"])
    .withMessage("Invalid result"),

  body("date")
    .notEmpty()
    .withMessage("Championship date is required")
    .isISO8601()
    .withMessage("Championship date must be valid"),

  body("venue")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Venue cannot exceed 150 characters"),

  body("organizer")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Organizer cannot exceed 150 characters"),

  body("remarks")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Remarks cannot exceed 1000 characters"),

  body("certificateUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Certificate URL cannot exceed 500 characters"),
];

export const updateChampionshipRecordValidator = [
  param("id").isMongoId().withMessage("Invalid championship record ID"),

  body("student").optional().isMongoId().withMessage("Invalid student ID"),

  body("championshipName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Championship name cannot be empty")
    .isLength({ min: 2, max: 150 }),

  body("level")
    .optional()
    .isIn(["district", "state", "national", "international", "open"]),

  body("eventType")
    .optional()
    .isIn(["kyorugi", "poomsae", "demo", "other"]),

  body("ageCategory").optional({ checkFalsy: true }).trim().isLength({
    max: 80,
  }),

  body("weightCategory").optional({ checkFalsy: true }).trim().isLength({
    max: 80,
  }),

  body("result")
    .optional()
    .isIn(["gold", "silver", "bronze", "participated", "disqualified"]),

  body("date").optional().isISO8601(),

  body("venue").optional({ checkFalsy: true }).trim().isLength({
    max: 150,
  }),

  body("organizer").optional({ checkFalsy: true }).trim().isLength({
    max: 150,
  }),

  body("remarks").optional({ checkFalsy: true }).trim().isLength({
    max: 1000,
  }),

  body("certificateUrl").optional({ checkFalsy: true }).trim().isLength({
    max: 500,
  }),
];

export const listChampionshipRecordsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("student").optional({ checkFalsy: true }).isMongoId(),
  query("level")
    .optional({ checkFalsy: true })
    .isIn(["district", "state", "national", "international", "open"]),
  query("eventType")
    .optional({ checkFalsy: true })
    .isIn(["kyorugi", "poomsae", "demo", "other"]),
  query("result")
    .optional({ checkFalsy: true })
    .isIn(["gold", "silver", "bronze", "participated", "disqualified"]),
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query("fromDate").optional({ checkFalsy: true }).isISO8601(),
  query("toDate").optional({ checkFalsy: true }).isISO8601(),
];