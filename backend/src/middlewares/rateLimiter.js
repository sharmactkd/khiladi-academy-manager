import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/apiResponse.js";

const buildRateLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return errorResponse(res, message, 429);
    },
  });
};

export const apiRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  message: "Too many API requests. Please slow down and try again.",
});

export const expensiveOperationRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many bulk operations. Please try again later.",
});

// Large Excel imports are intentionally sent in JSON chunks so that they stay
// below the global request-size limit. Allow enough requests for one workbook.
export const studentImportRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many student import requests. Please try again later.",
});

export const authRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts. Please try again later.",
});

export const loginRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

export const registerRateLimiter = buildRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
});

export const tournamentWebhookRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many tournament webhook requests. Please try again later.",
});

export const privateMediaRateLimiter = buildRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 2000,
  message: "Too many private media requests. Please try again later.",
});
