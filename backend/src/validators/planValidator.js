import { body, param } from "express-validator";

export const planCodeValidator = [
  param("code")
    .trim()
    .isIn(["free", "basic", "pro", "premium", "enterprise"])
    .withMessage("Invalid plan code"),
];

export const updatePlanValidator = [
  param("id").isMongoId().withMessage("Invalid plan ID"),
  body("name").optional().trim().isLength({ min: 2, max: 80 }),
  body("description").optional().trim().isLength({ max: 500 }),
  body("price").optional().isFloat({ min: 0 }),
  body("billingCycle").optional().isIn(["monthly", "yearly", "custom"]),
  body("features").optional().isArray(),
  body("limits").optional().isObject(),
  body("isActive").optional().isBoolean(),
  body("isPopular").optional().isBoolean(),
  body("sortOrder").optional().isInt({ min: 0 }),
];