import mongoose from "mongoose";
import { body, param, query } from "express-validator";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const optionalText = (field, max) =>
  body(field).optional({ checkFalsy: true }).trim().isLength({ max });

const commonOptionalValidators = [
  body("countryCode").optional({ checkFalsy: true }).trim().isLength({ max: 10 }),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("phoneNumbers").optional().isArray({ max: 4 }).withMessage("A maximum of 4 phone numbers is allowed"),
  body("phoneNumbers.*.countryCode").optional({ checkFalsy: true }).trim().isLength({ max: 10 }),
  body("phoneNumbers.*.phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("phoneNumbers.*.isPrimary").optional().isBoolean(),
  body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Invalid email"),
  optionalText("address", 500),
  optionalText("city", 80),
  optionalText("state", 80),
  optionalText("country", 80),
  body("currencyCode").optional().trim().isLength({ min: 3, max: 3 }).isAlpha().withMessage("Currency code must be a valid 3-letter ISO code"),
  optionalText("currencySymbol", 12),
  body("currencyCountryCode").optional().trim().isLength({ min: 2, max: 2 }).isAlpha().withMessage("Currency country code must be a valid 2-letter ISO code"),
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
  body("branchSince")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Branch since year must be valid"),
  body("facilities").optional().isArray(),
  body("facilities.*").optional().isString().trim().isLength({ max: 100 }),
  body("customFacilities").optional().isArray(),
  body("customFacilities.*").optional().isString().trim().isLength({ max: 100 }),
  body("languagesSpoken").optional().isArray(),
  body("languagesSpoken.*").optional().isString().trim().isLength({ max: 100 }),
  body("customLanguages").optional().isArray(),
  body("customLanguages.*").optional().isString().trim().isLength({ max: 100 }),
  body("manager")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid manager id");
      return true;
    }),
  body("coaches").optional().isArray().withMessage("Coaches must be an array"),
  body("coaches.*")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid coach id");
      return true;
    }),
  body("isMainBranch").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

export const branchIdValidator = [
  param("id").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid branch id");
    return true;
  }),
];

export const listBranchesValidator = [
  query("search").optional().trim().isLength({ max: 100 }),
  query("status")
    .optional()
    .isIn(["all", "active", "inactive"])
    .withMessage("Status must be all, active, or inactive"),
];

export const createBranchValidator = [
  body("directorName")
    .trim()
    .notEmpty()
    .withMessage("Director name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Director name must be 2 to 120 characters"),
  body("branchName")
    .trim()
    .notEmpty()
    .withMessage("Branch name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Branch name must be 2 to 120 characters"),
  body("branchCode")
    .trim()
    .notEmpty()
    .withMessage("Branch code is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Branch code must be 2 to 30 characters"),
  ...commonOptionalValidators,
];

export const updateBranchValidator = [
  ...branchIdValidator,
  body("directorName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Director name must be 2 to 120 characters"),
  body("branchName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Branch name must be 2 to 120 characters"),
  body("branchCode")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Branch code must be 2 to 30 characters"),
  ...commonOptionalValidators,
];
