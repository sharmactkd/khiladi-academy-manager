import { param, query } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const studentPerformanceValidator = [
  param("studentId").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid student id");
    return true;
  }),
];

export const batchPerformanceValidator = [
  param("batchId").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid batch id");
    return true;
  }),
];

export const academyPerformanceValidator = [
  query("branch")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidObjectId(value)) throw new Error("Invalid branch id");
      return true;
    }),
];