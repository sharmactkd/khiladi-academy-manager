import { body, param } from "express-validator";

export const validateCouponValidator = [
  body("couponCode")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ max: 50 }),

  body("planCode")
    .trim()
    .isIn(["free", "basic", "pro", "premium", "enterprise"])
    .withMessage("Invalid plan code"),
];

export const createCouponValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ max: 50 }),

  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),

  body("discountType")
    .isIn(["percentage", "fixed", "free_months"])
    .withMessage("Invalid discount type"),

  body("discountValue").optional().isFloat({ min: 0 }),
  body("freeMonths").optional().isInt({ min: 0 }),
  body("applicablePlanCodes").optional().isArray(),
  body("applicablePlanCodes.*")
    .optional()
    .isIn(["free", "basic", "pro", "premium", "enterprise"]),
  body("maxRedemptions").optional().isInt({ min: 0 }),
  body("perAcademyLimit").optional().isInt({ min: 1 }),
  body("startsAt").optional({ checkFalsy: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("isActive").optional().isBoolean(),
];

export const updateCouponValidator = [
  param("id").isMongoId().withMessage("Invalid coupon ID"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("discountType").optional().isIn(["percentage", "fixed", "free_months"]),
  body("discountValue").optional().isFloat({ min: 0 }),
  body("freeMonths").optional().isInt({ min: 0 }),
  body("applicablePlanCodes").optional().isArray(),
  body("maxRedemptions").optional().isInt({ min: 0 }),
  body("perAcademyLimit").optional().isInt({ min: 1 }),
  body("startsAt").optional({ checkFalsy: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("isActive").optional().isBoolean(),
];