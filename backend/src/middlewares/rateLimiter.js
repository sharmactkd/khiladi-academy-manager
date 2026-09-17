import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { errorResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";
import AuditLog from "../models/AuditLog.js";
import { sendRedisCommand } from "../config/redis.js";

const normalizedIdentifier = (req) => String(
  req.body?.identifier || req.body?.email || req.body?.phone || "anonymous"
).trim().toLowerCase().slice(0, 180);

const actorKey = (req) => String(req.user?._id || req.academyId || ipKeyGenerator(req.ip));

const buildRateLimiter = ({ windowMs, max, message, prefix, keyGenerator }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => actorKey(req)),
    ...(env.REDIS_URL ? {
      store: new RedisStore({
        prefix: `khiladi:${prefix}:`,
        sendCommand: (...args) => sendRedisCommand(...args),
      }),
    } : {}),
    handler: (req, res) => {
      void AuditLog.create({
        user: req.user?._id || null,
        academy: req.academyId || null,
        action: "RATE_LIMIT_EXCEEDED",
        module: "security",
        ip: req.ip || "",
        userAgent: req.get("user-agent") || "",
        metadata: { path: req.originalUrl, limiter: prefix },
      }).catch(() => {});
      return errorResponse(res, message, 429);
    },
  });
};

export const apiRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  prefix: "api",
  message: "Too many API requests. Please slow down and try again.",
});

export const expensiveOperationRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: "expensive",
  message: "Too many bulk operations. Please try again later.",
});

// Large Excel imports are intentionally sent in JSON chunks so that they stay
// below the global request-size limit. Allow enough requests for one workbook.
export const studentImportRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  prefix: "student-import",
  keyGenerator: (req) => `${actorKey(req)}:${String(req.get("x-import-session") || "default").slice(0, 80)}`,
  message: "Too many student import requests. Please try again later.",
});

// Attendance workbooks are imported one detected month block at a time. A
// historical workbook can legitimately contain many months in one operation.
export const attendanceImportRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  // A large historical workbook is deliberately sent in authenticated,
  // sub-2 MB preview/import chunks. Allow enough requests for multi-year
  // workbooks without weakening the stricter global/auth limiters.
  max: 500,
  prefix: "attendance-import",
  keyGenerator: (req) => `${actorKey(req)}:${String(req.get("x-import-session") || "default").slice(0, 80)}`,
  message: "Too many attendance import requests. Please try again later.",
});

export const authRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: "auth",
  message: "Too many auth attempts. Please try again later.",
});

export const loginRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: "login",
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${normalizedIdentifier(req)}`,
  message: "Too many login attempts. Please try again later.",
});

export const registerRateLimiter = buildRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  prefix: "register",
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${normalizedIdentifier(req)}`,
  message: "Too many registration attempts. Please try again later.",
});

export const publicEnquiryRateLimiter = buildRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 8,
  prefix: "public-enquiry",
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.params?.slug || "unknown").toLowerCase()}`,
  message: "Too many enquiry requests. Please try again later.",
});

export const tournamentWebhookRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  prefix: "tournament-webhook",
  message: "Too many tournament webhook requests. Please try again later.",
});

export const privateMediaRateLimiter = buildRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 2000,
  prefix: "private-media",
  message: "Too many private media requests. Please try again later.",
});
