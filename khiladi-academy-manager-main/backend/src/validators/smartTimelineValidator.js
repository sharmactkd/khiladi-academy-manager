import { param } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const smartTimelineStudentValidator = [
  param("studentId").custom((value) => {
    if (!isValidObjectId(value)) throw new Error("Invalid student id");
    return true;
  }),
];