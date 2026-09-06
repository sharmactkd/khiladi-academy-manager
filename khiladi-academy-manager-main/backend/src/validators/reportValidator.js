import { query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const reportFilterValidator = [
  query("branch")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid branch id");
      return true;
    }),

  query("batch")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid batch id");
      return true;
    }),

  query("student")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid student id");
      return true;
    }),

  query("fromDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fromDate must be a valid date"),

  query("toDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("toDate must be a valid date"),

  query("status").optional({ checkFalsy: true }).trim().isLength({ max: 50 }),

  query("format")
    .optional({ checkFalsy: true })
    .isIn(["json", "csv", "excel", "pdf"])
    .withMessage("Invalid report format"),
];