import { body, param } from "express-validator";

export const validateCouponValidator = [
  body("couponCode")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ max: 50 }),

  body("planCode").optional().trim().isIn(["free", "basic", "pro", "premium", "enterprise"]),
  body("addOnCode").optional().trim().isLength({ min: 2, max: 80 }),
  body("quantity").optional().isInt({ min: 1, max: 100 }),
  body().custom((value) => Boolean(value.planCode) !== Boolean(value.addOnCode)).withMessage("Provide either planCode or addOnCode"),
];

export const createCouponValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .matches(/^[A-Za-z0-9_-]{3,50}$/)
    .withMessage("Coupon code may contain letters, numbers, underscore and hyphen"),

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
  body("appliesTo").optional().isIn(["plans", "add_ons", "both"]),
  body("applicableAddOnCodes").optional().isArray(),
  body("applicableAddOnCodes.*").optional().trim().isLength({ min: 2, max: 80 }),
  body("minimumAmount").optional().isFloat({ min: 0 }),
  body("maximumDiscount").optional().isFloat({ min: 0 }),
  body("maxRedemptions").optional().isInt({ min: 0 }),
  body("perAcademyLimit").optional().isInt({ min: 1 }),
  body("startsAt").optional({ checkFalsy: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("isActive").optional().isBoolean(),
];

export const updateCouponValidator = [
  param("id").isMongoId().withMessage("Invalid coupon ID"),
  body("code").optional().trim().matches(/^[A-Za-z0-9_-]{3,50}$/).withMessage("Coupon code may contain letters, numbers, underscore and hyphen"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("discountType").optional().isIn(["percentage", "fixed", "free_months"]),
  body("discountValue").optional().isFloat({ min: 0 }),
  body("freeMonths").optional().isInt({ min: 0 }),
  body("applicablePlanCodes").optional().isArray(),
  body("applicablePlanCodes.*").optional().isIn(["free", "basic", "pro", "premium", "enterprise"]),
  body("appliesTo").optional().isIn(["plans", "add_ons", "both"]),
  body("applicableAddOnCodes").optional().isArray(),
  body("applicableAddOnCodes.*").optional().trim().isLength({ min: 2, max: 80 }),
  body("minimumAmount").optional().isFloat({ min: 0 }),
  body("maximumDiscount").optional().isFloat({ min: 0 }),
  body("maxRedemptions").optional().isInt({ min: 0 }),
  body("perAcademyLimit").optional().isInt({ min: 1 }),
  body("startsAt").optional({ checkFalsy: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("isActive").optional().isBoolean(),
];
