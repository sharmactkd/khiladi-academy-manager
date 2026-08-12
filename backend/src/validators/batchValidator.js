import { body, param, query } from "express-validator";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const arrayOfText = (field, max = 120) => [
  body(field).optional().isArray().withMessage(`${field} must be an array`),
  body(`${field}.*`).optional().isString().trim().isLength({ max }),
];
const optionalText = (field, max = 300) =>
  body(field).optional({ checkFalsy: true }).trim().isLength({ max });
const optionalMoney = (field) =>
  body(field)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a non-negative number`);
const optionalBoolean = (field) => body(field).optional().isBoolean();

const common = [
  body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("coach").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  ...arrayOfText("martialArts"),
  ...arrayOfText("batchTypes"),
  ...arrayOfText("customBatchTypes"),
  ...arrayOfText("skillLevels"),
  ...arrayOfText("modes"),
  ...arrayOfText("sessionSlots"),
  ...arrayOfText("batchLanguages"),
  ...arrayOfText("customBatchLanguages"),
  optionalText("batchCode", 40),
  optionalText("venue", 120),
  optionalText("headCoachName", 120),
  optionalText("headCoachCountryCode", 10),
  optionalText("headCoachPhone", 20),
  optionalText("headCoachAchievements", 1000),
  optionalText("assistantCoachName", 120),
  optionalText("assistantCoachCountryCode", 10),
  optionalText("assistantCoachPhone", 20),
  optionalText("assistantCoachAchievements", 1000),
  body("additionalCoaches").optional().isArray(),
  optionalText("additionalCoaches.*.name", 120),
  optionalText("additionalCoaches.*.countryCode", 10),
  optionalText("additionalCoaches.*.phone", 20),
  optionalText("additionalCoaches.*.achievements", 1000),
  body("schedule")
    .optional()
    .isArray()
    .withMessage("Schedule must be an array"),
  body("schedule.*.day").optional().isIn(DAYS),
  body("schedule.*.startTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("schedule.*.endTime")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("capacity").optional().isInt({ min: 0 }),
  body("minAge")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 }),
  body("maxAge")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 }),
  optionalText("minBelt", 100),
  optionalText("maxBelt", 100),
  optionalMoney("monthlyFee"),
  optionalMoney("quarterlyFee"),
  optionalMoney("annualFee"),
  optionalMoney("registrationFee"),
  optionalMoney("uniformFee"),
  optionalMoney("examinationFee"),
  optionalMoney("lateFee"),
  optionalText("whatsappGroupLink", 300),
  optionalText("googleMeetLink", 300),
  optionalText("notes", 2000),
  optionalBoolean("noCapacityLimit"),
  optionalBoolean("noMinAgeLimit"),
  optionalBoolean("noMaxAgeLimit"),
  optionalBoolean("noMinBeltLimit"),
  optionalBoolean("noMaxBeltLimit"),
  optionalBoolean("noRegistrationFee"),
  optionalBoolean("noLateFee"),
  optionalBoolean("isActive"),
];

export const batchIdValidator = [
  param("id").isMongoId().withMessage("Invalid batch ID"),
];

export const createBatchValidator = [
  body("batchName")
    .trim()
    .notEmpty()
    .withMessage("Batch name is required")
    .isLength({ max: 120 }),
  body("martialArt").optional().trim(),
  body().custom((payload) => {
    if (
      !String(payload.martialArt || "").trim() &&
      !Array.isArray(payload.martialArts)
    ) {
      throw new Error("At least one martial art is required");
    }
    return true;
  }),
  ...common,
];

export const updateBatchValidator = [
  ...batchIdValidator,
  body("batchName").optional().trim().notEmpty().isLength({ max: 120 }),
  body("martialArt").optional().trim(),
  ...common,
];

export const listBatchesValidator = [
  query("status").optional({ checkFalsy: true }).isIn(["active", "inactive"]),
  query("branch").optional({ checkFalsy: true }).isMongoId(),
  query("martialArt").optional({ checkFalsy: true }).trim(),
];
