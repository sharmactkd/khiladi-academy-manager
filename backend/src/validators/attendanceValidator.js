import { body, param, query } from "express-validator";

export const markAttendanceValidator = [
  body("batch").isMongoId().withMessage("Valid batch ID is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("records").isArray({ min: 1 }).withMessage("Records are required"),
  body("records.*.student").isMongoId().withMessage("Valid student is required"),
  body("records.*.status")
    .isIn(["present", "absent", "late", "leave"])
    .withMessage("Invalid attendance status"),
  body("records.*.note").optional().trim().isLength({ max: 300 }),
];

export const attendanceListValidator = [
  query("batch").optional({ checkFalsy: true }).isMongoId(),
  query("from").optional({ checkFalsy: true }).isISO8601(),
  query("to").optional({ checkFalsy: true }).isISO8601(),
];

export const studentAttendanceValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
  query("from").optional({ checkFalsy: true }).isISO8601(),
  query("to").optional({ checkFalsy: true }).isISO8601(),
];

export const batchAttendanceValidator = [
  param("batchId").isMongoId().withMessage("Invalid batch ID"),
  query("from").optional({ checkFalsy: true }).isISO8601(),
  query("to").optional({ checkFalsy: true }).isISO8601(),
];