import { body, param, query } from "express-validator";

export const createTournamentEntrySyncValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("externalTournamentId")
    .trim()
    .notEmpty()
    .withMessage("External tournament ID is required")
    .isLength({ max: 120 })
    .withMessage("External tournament ID cannot exceed 120 characters"),

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

  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];

export const listTournamentEntrySyncValidator = [
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

  query("syncStatus")
    .optional({ checkFalsy: true })
    .isIn(["pending", "synced", "failed", "cancelled"])
    .withMessage("Invalid sync status"),
];

export const tournamentEntrySyncIdValidator = [
  param("id").isMongoId().withMessage("Invalid entry sync ID"),
];

export const tournamentEntrySyncStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];