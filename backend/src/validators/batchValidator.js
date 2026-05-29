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

const scheduleValidator = [
  body("schedule").optional().isArray().withMessage("Schedule must be an array"),
  body("schedule.*.day").optional().isIn(days).withMessage("Invalid schedule day"),
  body("schedule.*.startTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Schedule start time must be HH:mm"),
  body("schedule.*.endTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Schedule end time must be HH:mm"),
];

const feeValidators = [
  body("monthlyFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly fee must be a valid non-negative number"),

  body("quarterlyFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Quarterly fee must be a valid non-negative number"),

  body("annualFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Annual fee must be a valid non-negative number"),

  body("feeDueDay")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("Fee due day must be between 1 and 31"),
];

export const batchIdValidator = [
  param("id").isMongoId().withMessage("Invalid batch ID"),
];

export const createBatchValidator = [
  body("batchName").trim().notEmpty().withMessage("Batch name is required"),
  body("martialArt").trim().notEmpty().withMessage("Martial art is required"),

  body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("coach").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("assistantCoaches").optional().isArray(),
  body("assistantCoaches.*").optional().isMongoId(),

  body("students").optional().isArray(),
  body("students.*").optional().isMongoId(),

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
  body("capacity").optional().isInt({ min: 0 }),

  body("status").optional().isIn(["active", "inactive"]),
  body("isActive").optional().isBoolean(),

  body("notes").optional({ checkFalsy: true }).trim(),

  ...scheduleValidator,
  ...feeValidators,
];

export const updateBatchValidator = [
  param("id").isMongoId().withMessage("Invalid batch ID"),

  body("batchName").optional().trim().notEmpty(),
  body("martialArt").optional().trim().notEmpty(),

  body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("coach").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("assistantCoaches").optional().isArray(),
  body("assistantCoaches.*").optional().isMongoId(),

  body("students").optional().isArray(),
  body("students.*").optional().isMongoId(),

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
  body("capacity").optional().isInt({ min: 0 }),

  body("status").optional().isIn(["active", "inactive"]),
  body("isActive").optional().isBoolean(),

  body("notes").optional({ checkFalsy: true }).trim(),

  ...scheduleValidator,
  ...feeValidators,
];

export const listBatchesValidator = [
  query("status").optional({ checkFalsy: true }).isIn(["active", "inactive"]),
  query("branch").optional({ checkFalsy: true }).isMongoId(),
  query("martialArt").optional({ checkFalsy: true }).trim(),
];