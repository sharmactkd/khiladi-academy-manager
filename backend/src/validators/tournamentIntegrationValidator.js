import { body, query } from "express-validator";

export const connectTournamentIntegrationValidator = [
  body("apiBaseUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Valid API base URL is required"),

  body("integrationName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Integration name must be between 2 and 120 characters"),
];

export const listIntegrationLogsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Invalid limit"),

  query("type")
    .optional({ checkFalsy: true })
    .isIn([
      "connect",
      "disconnect",
      "regenerate_key",
      "entry_submit",
      "result_import",
      "webhook",
      "status_check",
    ])
    .withMessage("Invalid log type"),

  query("status")
    .optional({ checkFalsy: true })
    .isIn(["success", "failed", "pending", "duplicate"])
    .withMessage("Invalid log status"),

  query("fromDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid fromDate"),

  query("toDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid toDate"),
];