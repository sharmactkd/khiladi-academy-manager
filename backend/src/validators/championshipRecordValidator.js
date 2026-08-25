import { body, param, query, validationResult } from "express-validator";

import {
  AGE_CATEGORIES,
  BOUT_OUTCOME_METHODS,
  CHAMPIONSHIP_LEVELS,
  CHAMPIONSHIP_TYPES,
  EVENT_TYPES,
  INTERNATIONAL_GRADINGS,
  OFFICIAL_CATEGORIES,
  POOMSAE_TYPES,
  RESULT_TYPES,
} from "../models/ChampionshipRecord.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: errors.array()[0]?.msg || "Validation failed",
    errors: errors.array(),
  });
};

export const validateChampionshipRecordId = [
  param("id")
    .isMongoId()
    .withMessage("Valid championship record id is required"),
  validateRequest,
];

export const validateStudentChampionshipRecordParam = [
  param("studentId").isMongoId().withMessage("Valid student id is required"),
  validateRequest,
];

const commonChampionshipRecordRules = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("championshipName")
    .trim()
    .notEmpty()
    .withMessage("Championship name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Championship name must be between 2 and 200 characters"),

  body("championshipType")
    .optional()
    .isIn(CHAMPIONSHIP_TYPES)
    .withMessage("Invalid championship type"),

  body("officialCategory")
    .optional({ checkFalsy: true })
    .isIn(OFFICIAL_CATEGORIES)
    .withMessage("Invalid official category"),

  body("level")
    .notEmpty()
    .withMessage("Championship level is required")
    .isIn(CHAMPIONSHIP_LEVELS)
    .withMessage("Invalid championship level"),

  body("grading")
    .optional({ checkFalsy: true })
    .isIn(INTERNATIONAL_GRADINGS)
    .withMessage("Invalid international grading"),

  body("eventType")
    .notEmpty()
    .withMessage("Event type is required")
    .isIn(EVENT_TYPES)
    .withMessage("Invalid event type"),

  body("poomsaeType")
    .optional({ checkFalsy: true })
    .isIn(POOMSAE_TYPES)
    .withMessage("Invalid poomsae type"),

  body("ageCategory")
    .notEmpty()
    .withMessage("Age category is required")
    .isIn(AGE_CATEGORIES)
    .withMessage("Invalid age category"),

  body("result")
    .optional()
    .isIn(RESULT_TYPES)
    .withMessage("Invalid result"),

  body("danCategory")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Dan category cannot exceed 40 characters"),

  body("disqualificationReason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Disqualification reason cannot exceed 500 characters"),

  body("bouts").optional().isArray({ max: 50 }).withMessage("Invalid bouts"),
  body("bouts.*.outcomeMethod")
    .optional()
    .isIn(BOUT_OUTCOME_METHODS)
    .withMessage("Invalid bout outcome"),

  body("startDate").notEmpty().withMessage("Start date is required"),
  body("endDate").notEmpty().withMessage("End date is required"),

  body("totalBouts")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total bouts cannot be negative"),

  body("boutsWon")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bouts won cannot be negative"),

  ...["certificateUrl", "medalPhotoUrl", "matchVideoUrl", "newsUrl"].map(
    (field) =>
      body(field)
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage(`${field} must use http or https`)
        .isLength({ max: 500 })
        .withMessage(`${field} cannot exceed 500 characters`)
  ),

  body("boutsLost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bouts lost cannot be negative"),

  body("ranking")
    .optional({ checkFalsy: true })
    .isFloat({ min: 1 })
    .withMessage("Ranking must be positive"),

  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Remarks cannot exceed 2000 characters"),

  body().custom((value) => {
    if (value.championshipType === "Official" && !value.officialCategory) {
      throw new Error("Official category is required for official championship");
    }

    if (
      value.championshipType === "Official" &&
      value.level === "International" &&
      !value.grading
    ) {
      throw new Error(
        "Grading is required for official international championship"
      );
    }

    if (value.eventType === "Poomsae" && !value.poomsaeType) {
      throw new Error("Poomsae type is required");
    }

    if (value.result === "Disqualified" && !String(value.disqualificationReason || "").trim()) {
      throw new Error("Disqualification reason is required");
    }

    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (end < start) {
          throw new Error("End date cannot be before start date");
        }
      }
    }

    const totalBouts = Number(value.totalBouts || 0);
    const boutsWon = Number(value.boutsWon || 0);
    const boutsLost = Number(value.boutsLost || 0);

    if (boutsWon + boutsLost > totalBouts) {
      throw new Error("Won + lost bouts cannot be greater than total bouts");
    }


    if (Array.isArray(value.bouts)) {
      if (value.bouts.length !== totalBouts) {
        throw new Error("Please select an outcome for every bout");
      }
      if (value.bouts.some((bout) => !BOUT_OUTCOME_METHODS.includes(bout?.outcomeMethod))) {
        throw new Error("Invalid bout outcome");
      }
    }

    return true;
  }),
];

export const createChampionshipRecordValidation = [
  ...commonChampionshipRecordRules,
  validateRequest,
];

export const updateChampionshipRecordValidation = [
  ...commonChampionshipRecordRules,
  validateRequest,
];

export const getChampionshipRecordsValidation = [
  query("latestByStudent").optional().isBoolean(),
  query("student").optional().isMongoId().withMessage("Invalid student id"),

  query("championshipType")
    .optional()
    .isIn(CHAMPIONSHIP_TYPES)
    .withMessage("Invalid championship type"),

  query("level")
    .optional()
    .isIn(CHAMPIONSHIP_LEVELS)
    .withMessage("Invalid championship level"),

  query("eventType")
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage("Invalid event type"),

  query("ageCategory")
    .optional()
    .isIn(AGE_CATEGORIES)
    .withMessage("Invalid age category"),

  query("result")
    .optional()
    .isIn(RESULT_TYPES)
    .withMessage("Invalid result"),

  query("year")
    .optional()
    .isInt({ min: 1900 })
    .withMessage("Invalid year"),

  validateRequest,
];

export const championshipRecordIdValidator = validateChampionshipRecordId;

export const championshipStudentIdValidator =
  validateStudentChampionshipRecordParam;

export const createChampionshipRecordValidator =
  createChampionshipRecordValidation;

export const updateChampionshipRecordValidator =
  updateChampionshipRecordValidation;

export const listChampionshipRecordsValidator =
  getChampionshipRecordsValidation;
