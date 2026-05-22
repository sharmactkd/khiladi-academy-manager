import { body, param, query } from "express-validator";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const batchIdValidator = [
  param("id").isMongoId().withMessage("Invalid batch ID"),
];

export const createBatchValidator = [
  body("batchName").trim().notEmpty().withMessage("Batch name is required"),
  body("martialArt").trim().notEmpty().withMessage("Martial art is required"),
  body("coach").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("assistantCoaches").optional().isArray(),
  body("assistantCoaches.*").optional().isMongoId(),
  body("days").optional().isArray(),
  body("days.*").optional().isIn(days),
  body("startTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be HH:mm"),
  body("endTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be HH:mm"),
  body("maxStudents").optional().isInt({ min: 0 }),
  body("status").optional().isIn(["active", "inactive"]),
];

export const updateBatchValidator = [
  param("id").isMongoId().withMessage("Invalid batch ID"),
  body("batchName").optional().trim().notEmpty(),
  body("martialArt").optional().trim().notEmpty(),
  body("coach").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("assistantCoaches").optional().isArray(),
  body("assistantCoaches.*").optional().isMongoId(),
  body("days").optional().isArray(),
  body("days.*").optional().isIn(days),
  body("maxStudents").optional().isInt({ min: 0 }),
  body("status").optional().isIn(["active", "inactive"]),
];

export const listBatchesValidator = [
  query("status").optional().isIn(["active", "inactive"]),
];