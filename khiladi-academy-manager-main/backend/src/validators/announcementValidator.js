import { body, param, query } from "express-validator";

export const announcementIdValidator = [
  param("id").isMongoId().withMessage("Invalid announcement ID"),
];

export const createAnnouncementValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Title must be between 2 and 150 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 2, max: 3000 })
    .withMessage("Message must be between 2 and 3000 characters"),

  body("category")
    .optional()
    .isIn([
      "general",
      "fees",
      "attendance",
      "belt_test",
      "championship",
      "holiday",
      "urgent",
    ])
    .withMessage("Invalid announcement category"),

  body("audienceType")
    .optional()
    .isIn(["all", "students", "parents", "batch", "individual"])
    .withMessage("Invalid audience type"),

  body("batch")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid batch ID"),

  body("students").optional().isArray(),
  body("students.*").optional().isMongoId().withMessage("Invalid student ID"),

  body("guardianUsers").optional().isArray(),
  body("guardianUsers.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid guardian user ID"),

  body("publishAt")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Publish date must be valid"),

  body("expiresAt")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Expiry date must be valid"),

  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),

  body("channels")
    .optional()
    .isArray()
    .withMessage("Channels must be an array"),

  body("channels.*")
    .optional()
    .isIn(["internal", "email", "whatsapp"])
    .withMessage("Invalid communication channel"),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status"),
];

export const updateAnnouncementValidator = [
  param("id").isMongoId().withMessage("Invalid announcement ID"),

  body("title").optional().trim().isLength({ min: 2, max: 150 }),
  body("message").optional().trim().isLength({ min: 2, max: 3000 }),

  body("category")
    .optional()
    .isIn([
      "general",
      "fees",
      "attendance",
      "belt_test",
      "championship",
      "holiday",
      "urgent",
    ]),

  body("audienceType")
    .optional()
    .isIn(["all", "students", "parents", "batch", "individual"]),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),

  body("students").optional().isArray(),
  body("students.*").optional().isMongoId(),

  body("guardianUsers").optional().isArray(),
  body("guardianUsers.*").optional().isMongoId(),

  body("publishAt").optional({ checkFalsy: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),

  body("priority").optional().isIn(["low", "normal", "high", "urgent"]),

  body("channels").optional().isArray(),
  body("channels.*").optional().isIn(["internal", "email", "whatsapp"]),

  body("status").optional().isIn(["draft", "published", "archived"]),
];

export const listAnnouncementsValidator = [
  query("status")
    .optional({ checkFalsy: true })
    .isIn(["draft", "published", "archived"]),
  query("category")
    .optional({ checkFalsy: true })
    .isIn([
      "general",
      "fees",
      "attendance",
      "belt_test",
      "championship",
      "holiday",
      "urgent",
    ]),
  query("audienceType")
    .optional({ checkFalsy: true })
    .isIn(["all", "students", "parents", "batch", "individual"]),
  query("priority")
    .optional({ checkFalsy: true })
    .isIn(["low", "normal", "high", "urgent"]),
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
];