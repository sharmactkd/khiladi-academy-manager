import { body, param } from "express-validator";

export const idCardTemplateIdValidator = [
  param("id").isMongoId().withMessage("Invalid ID card template ID"),
];

export const idCardIdValidator = [
  param("id").isMongoId().withMessage("Invalid ID card ID"),
];

export const idCardStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createIdCardTemplateValidator = [
  body("templateName")
    .trim()
    .notEmpty()
    .withMessage("Template name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Template name must be between 2 and 100 characters"),

  body("frontDesign").optional().isObject(),
  body("backDesign").optional().isObject(),

  body("logo")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Logo URL cannot exceed 500 characters"),

  body("backgroundColor")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Background color must be a valid hex color"),

  body("textColor")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Text color must be a valid hex color"),

  body("fields")
    .optional()
    .isArray()
    .withMessage("Fields must be an array"),

  body("fields.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Each field must be between 1 and 80 characters"),

  body("isDefault").optional().isBoolean(),
];

export const updateIdCardTemplateValidator = [
  param("id").isMongoId().withMessage("Invalid ID card template ID"),

  body("templateName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Template name cannot be empty")
    .isLength({ min: 2, max: 100 }),

  body("frontDesign").optional().isObject(),
  body("backDesign").optional().isObject(),

  body("logo").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),

  body("backgroundColor")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),

  body("textColor")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),

  body("fields").optional().isArray(),
  body("fields.*").optional().trim().isLength({ min: 1, max: 80 }),
  body("isDefault").optional().isBoolean(),
];

export const generateIdCardValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("template").isMongoId().withMessage("Valid template is required"),

  body("cardNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Card number cannot exceed 80 characters"),

  body("qrCodeData")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("QR code data cannot exceed 1000 characters"),

  body("issuedDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Issued date must be valid"),

  body("validTill")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Valid till date must be valid"),
];

export const updateIdCardStatusValidator = [
  param("id").isMongoId().withMessage("Invalid ID card ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "expired", "cancelled"])
    .withMessage("Status must be active, expired, or cancelled"),
];