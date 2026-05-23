import { body, param, query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const branchIdValidator = [
  param("id").custom((value) => {
    if (!isValidObjectId(value)) {
      throw new Error("Invalid branch id");
    }
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

  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email"),

  body("address").optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body("city").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("state").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("country").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("pincode").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),

  body("manager")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid manager id");
      return true;
    }),

  body("coaches")
    .optional()
    .isArray()
    .withMessage("Coaches must be an array"),

  body("coaches.*")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid coach id");
      return true;
    }),

  body("isMainBranch").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

export const updateBranchValidator = [
  ...branchIdValidator,

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

  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email"),

  body("address").optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body("city").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("state").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("country").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("pincode").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),

  body("manager")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid manager id");
      return true;
    }),

  body("coaches").optional().isArray(),

  body("coaches.*")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid coach id");
      return true;
    }),

  body("isMainBranch").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];