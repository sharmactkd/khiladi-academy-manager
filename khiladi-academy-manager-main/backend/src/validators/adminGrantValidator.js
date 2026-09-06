import { body, param } from "express-validator";

export const createAdminGrantValidator = [
  body("academy").isMongoId().withMessage("Valid academy is required"),

  body("planCode")
    .trim()
    .isIn(["free", "basic", "pro", "premium", "enterprise"])
    .withMessage("Invalid plan code"),

  body("grantType")
    .isIn(["trial_extension", "free_access", "lifetime", "custom"])
    .withMessage("Invalid grant type"),

  body("startDate").optional({ checkFalsy: true }).isISO8601(),
  body("endDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),

  body("reason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }),
];

export const adminGrantIdValidator = [
  param("id").isMongoId().withMessage("Invalid admin grant ID"),
];