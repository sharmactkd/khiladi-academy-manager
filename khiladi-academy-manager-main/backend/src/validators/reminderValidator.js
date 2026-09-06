import { body, query } from "express-validator";

export const communicationLogsValidator = [
  query("channel")
    .optional({ checkFalsy: true })
    .isIn(["email", "whatsapp", "internal"]),
  query("type")
    .optional({ checkFalsy: true })
    .isIn([
      "announcement",
      "fee_reminder",
      "attendance_alert",
      "belt_test",
      "championship",
      "system",
    ]),
  query("status")
    .optional({ checkFalsy: true })
    .isIn(["pending", "sent", "failed", "skipped"]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

export const feeReminderValidator = [
  body("studentIds").optional().isArray(),
  body("studentIds.*").optional().isMongoId(),
  body("channels")
    .optional()
    .isArray()
    .withMessage("Channels must be an array"),
  body("channels.*")
    .optional()
    .isIn(["internal", "email", "whatsapp"])
    .withMessage("Invalid channel"),
  body("message")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }),
];

export const attendanceReminderValidator = [
  body("date")
    .notEmpty()
    .withMessage("Attendance date is required")
    .isISO8601()
    .withMessage("Attendance date must be valid"),
  body("batch")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid batch ID"),
  body("channels")
    .optional()
    .isArray()
    .withMessage("Channels must be an array"),
  body("channels.*")
    .optional()
    .isIn(["internal", "email", "whatsapp"])
    .withMessage("Invalid channel"),
  body("message")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }),
];