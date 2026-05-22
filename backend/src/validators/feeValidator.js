import { body, param, query } from "express-validator";

export const feePlanIdValidator = [
  param("id").isMongoId().withMessage("Invalid fee plan ID"),
];

export const createFeePlanValidator = [
  body("name").trim().notEmpty().withMessage("Fee plan name is required"),
  body("amount").isFloat({ min: 0 }).withMessage("Valid amount is required"),
  body("billingCycle")
    .optional()
    .isIn(["monthly", "quarterly", "yearly", "custom"]),
  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("isActive").optional().isBoolean(),
];

export const updateFeePlanValidator = [
  param("id").isMongoId().withMessage("Invalid fee plan ID"),
  body("name").optional().trim().notEmpty(),
  body("amount").optional().isFloat({ min: 0 }),
  body("billingCycle")
    .optional()
    .isIn(["monthly", "quarterly", "yearly", "custom"]),
  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("isActive").optional().isBoolean(),
];

export const feePaymentIdValidator = [
  param("id").isMongoId().withMessage("Invalid fee payment ID"),
];

export const createFeePaymentValidator = [
  body("student").isMongoId().withMessage("Valid student ID is required"),
  body("feePlan").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("amount").isFloat({ min: 0 }).withMessage("Valid amount is required"),
  body("discount").optional().isFloat({ min: 0 }),
  body("month")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("Month must be YYYY-MM"),
  body("dueDate").optional({ checkFalsy: true }).isISO8601(),
  body("paidDate").optional({ checkFalsy: true }).isISO8601(),
  body("status")
    .optional()
    .isIn(["pending", "paid", "overdue", "partial", "cancelled"]),
  body("paymentMode").optional().isIn(["cash", "upi", "bank", "online", "other"]),
];

export const updateFeePaymentValidator = [
  param("id").isMongoId().withMessage("Invalid fee payment ID"),
  body("feePlan").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("amount").optional().isFloat({ min: 0 }),
  body("discount").optional().isFloat({ min: 0 }),
  body("month").optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/),
  body("dueDate").optional({ checkFalsy: true }).isISO8601(),
  body("paidDate").optional({ checkFalsy: true }).isISO8601(),
  body("status")
    .optional()
    .isIn(["pending", "paid", "overdue", "partial", "cancelled"]),
  body("paymentMode").optional().isIn(["cash", "upi", "bank", "online", "other"]),
];

export const listFeePaymentsValidator = [
  query("student").optional({ checkFalsy: true }).isMongoId(),
  query("status")
    .optional()
    .isIn(["pending", "paid", "overdue", "partial", "cancelled"]),
  query("month").optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/),
];