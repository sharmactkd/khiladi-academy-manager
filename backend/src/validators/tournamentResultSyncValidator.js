import { body, param, query } from "express-validator";

const resultBodyValidators = [
  body("externalTournamentId")
    .trim()
    .notEmpty()
    .withMessage("External tournament ID is required")
    .isLength({ max: 120 })
    .withMessage("External tournament ID cannot exceed 120 characters"),

  body("externalPlayerId")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("External player ID cannot exceed 120 characters"),

  body("academyStudentId")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid academy student ID"),

  body("studentId")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid student ID"),

  body("tournamentName")
    .trim()
    .notEmpty()
    .withMessage("Tournament name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Tournament name must be between 2 and 150 characters"),

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

  body("level")
    .optional()
    .isIn(["district", "state", "national", "international", "open"])
    .withMessage("Invalid level"),

  body("result")
    .isIn(["gold", "silver", "bronze", "participated", "disqualified"])
    .withMessage("Invalid result"),

  body("date").isISO8601().withMessage("Valid result date is required"),

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
];

export const importTournamentResultValidator = resultBodyValidators;

export const webhookTournamentResultValidator = resultBodyValidators;

export const listTournamentResultSyncValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Invalid limit"),

  query("student")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid student ID"),

  query("externalTournamentId")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Invalid external tournament ID"),

  query("syncSource")
    .optional({ checkFalsy: true })
    .isIn(["manual_import", "webhook", "external_api"])
    .withMessage("Invalid sync source"),

  query("syncStatus")
    .optional({ checkFalsy: true })
    .isIn(["imported", "duplicate", "failed"])
    .withMessage("Invalid sync status"),

  query("result")
    .optional({ checkFalsy: true })
    .isIn(["gold", "silver", "bronze", "participated", "disqualified"])
    .withMessage("Invalid result"),
];

export const tournamentResultSyncStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];