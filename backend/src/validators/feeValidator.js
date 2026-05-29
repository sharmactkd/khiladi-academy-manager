import { body, param, query } from "express-validator";

export const feePlanIdValidator = [
  param("id").isMongoId().withMessage("Invalid fee plan ID"),
];

export const createFeePlanValidator = [
  body("name").trim().notEmpty().withMessage("Fee plan name is required"),

  body("monthlyAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valid monthly amount is required"),

  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valid amount is required"),

  body("billingCycle")
    .optional()
    .isIn(["monthly", "quarterly", "yearly", "custom"]),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("dueDay")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("Due day must be between 1 and 31"),

  body("martialArt").optional({ checkFalsy: true }).trim(),

  body("description").optional({ checkFalsy: true }).trim(),

  body("isDefault").optional().isBoolean(),

  body("isActive").optional().isBoolean(),
];

export const updateFeePlanValidator = [
  param("id").isMongoId().withMessage("Invalid fee plan ID"),

  body("name").optional().trim().notEmpty(),

  body("monthlyAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valid monthly amount is required"),

  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valid amount is required"),

  body("billingCycle")
    .optional()
    .isIn(["monthly", "quarterly", "yearly", "custom"]),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("dueDay")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("Due day must be between 1 and 31"),

  body("martialArt").optional({ checkFalsy: true }).trim(),

  body("description").optional({ checkFalsy: true }).trim(),

  body("isDefault").optional().isBoolean(),

  body("isActive").optional().isBoolean(),
];

export const feePaymentIdValidator = [
  param("id").isMongoId().withMessage("Invalid fee payment ID"),
];

export const createFeePaymentValidator = [
  body("student").isMongoId().withMessage("Valid student ID is required"),

  body("feePlan").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Valid amount is required"),

  body("discount").optional().isFloat({ min: 0 }),

  body("amountPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valid amount paid is required"),

  body("feeMonth")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Fee month must be between 1 and 12"),

  body("feeYear")
    .optional()
    .isInt({ min: 2020 })
    .withMessage("Fee year is invalid"),

  body("month")
    .optional()
    .custom((value) => {
      const stringValue = String(value || "");

      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(stringValue)) return true;
      if (/^(0?[1-9]|1[0-2])$/.test(stringValue)) return true;

      throw new Error("Month must be YYYY-MM or 1-12");
    }),

  body("year")
    .optional()
    .isInt({ min: 2020 })
    .withMessage("Year is invalid"),

  body("dueDate").optional({ checkFalsy: true }).isISO8601(),

  body("paymentDate").optional({ checkFalsy: true }).isISO8601(),

  body("paidDate").optional({ checkFalsy: true }).isISO8601(),

  body("status")
    .optional()
    .isIn(["due", "pending", "paid", "overdue", "partial", "cancelled"]),

  body("paymentMode")
    .optional()
    .isIn(["cash", "upi", "bank", "card", "online", "other"]),

  body("notes").optional({ checkFalsy: true }).trim(),

  body("note").optional({ checkFalsy: true }).trim(),
];

export const updateFeePaymentValidator = [
  param("id").isMongoId().withMessage("Invalid fee payment ID"),

  body("feePlan").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("amount").optional().isFloat({ min: 0 }),

  body("discount").optional().isFloat({ min: 0 }),

  body("amountPaid").optional().isFloat({ min: 0 }),

  body("month")
    .optional()
    .custom((value) => {
      const stringValue = String(value || "");

      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(stringValue)) return true;
      if (/^(0?[1-9]|1[0-2])$/.test(stringValue)) return true;

      throw new Error("Month must be YYYY-MM or 1-12");
    }),

  body("feeMonth").optional().isInt({ min: 1, max: 12 }),

  body("feeYear").optional().isInt({ min: 2020 }),

  body("dueDate").optional({ checkFalsy: true }).isISO8601(),

  body("paymentDate").optional({ checkFalsy: true }).isISO8601(),

  body("paidDate").optional({ checkFalsy: true }).isISO8601(),

  body("status")
    .optional()
    .isIn(["due", "pending", "paid", "overdue", "partial", "cancelled"]),

  body("paymentMode")
    .optional()
    .isIn(["cash", "upi", "bank", "card", "online", "other"]),

  body("notes").optional({ checkFalsy: true }).trim(),

  body("note").optional({ checkFalsy: true }).trim(),
];

export const listFeePaymentsValidator = [
  query("student").optional({ checkFalsy: true }).isMongoId(),

  query("batch").optional({ checkFalsy: true }).isMongoId(),

  query("status")
    .optional({ checkFalsy: true })
    .isIn(["due", "pending", "paid", "overdue", "partial", "cancelled"]),

  query("paymentMode")
    .optional({ checkFalsy: true })
    .isIn(["cash", "upi", "bank", "card", "online", "other"]),

  query("month")
    .optional({ checkFalsy: true })
    .custom((value) => {
      const stringValue = String(value || "");

      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(stringValue)) return true;
      if (/^(0?[1-9]|1[0-2])$/.test(stringValue)) return true;

      throw new Error("Month must be YYYY-MM or 1-12");
    }),

  query("year")
    .optional({ checkFalsy: true })
    .isInt({ min: 2020 })
    .withMessage("Year is invalid"),

  query("feeMonth")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 12 }),

  query("feeYear")
    .optional({ checkFalsy: true })
    .isInt({ min: 2020 }),

  query("search").optional({ checkFalsy: true }).trim(),
];