import env from "../config/env.js";
import { errorResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let data = null;

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    data = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
  }

  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  logger.error(`${statusCode} - ${message}`);

  if (!env.isProduction && error.stack) {
    data = {
      ...(data ? { errors: data } : {}),
      stack: error.stack,
    };
  }

  return errorResponse(res, message, statusCode, data);
};