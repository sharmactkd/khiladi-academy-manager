import { validationResult } from "express-validator";
import { errorResponse } from "../utils/apiResponse.js";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return errorResponse(res, "Validation failed", 400, formattedErrors);
};

export default validateRequest;