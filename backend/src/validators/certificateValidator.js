import { body, param } from "express-validator";

export const certificateTemplateIdValidator = [
  param("id").isMongoId().withMessage("Invalid certificate template ID"),
];

export const certificateIdValidator = [
  param("id").isMongoId().withMessage("Invalid certificate ID"),
];

export const certificateStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createCertificateTemplateValidator = [
  body("templateName")
    .trim()
    .notEmpty()
    .withMessage("Template name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Template name must be between 2 and 100 characters"),

  body("certificateType")
    .optional()
    .isIn(["belt", "participation", "achievement", "custom"])
    .withMessage("Invalid certificate type"),

  body("backgroundImage")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Background image URL cannot exceed 500 characters"),

  body("layoutJson").optional().isObject(),

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

export const updateCertificateTemplateValidator = [
  param("id").isMongoId().withMessage("Invalid certificate template ID"),

  body("templateName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Template name cannot be empty")
    .isLength({ min: 2, max: 100 }),

  body("certificateType")
    .optional()
    .isIn(["belt", "participation", "achievement", "custom"]),

  body("backgroundImage")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),

  body("layoutJson").optional().isObject(),

  body("fields").optional().isArray(),
  body("fields.*").optional().trim().isLength({ min: 1, max: 80 }),

  body("isDefault").optional().isBoolean(),
];

export const generateCertificateValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),

  body("template").isMongoId().withMessage("Valid template is required"),

  body("certificateType")
    .notEmpty()
    .withMessage("Certificate type is required")
    .isIn(["belt", "participation", "achievement", "custom"])
    .withMessage("Invalid certificate type"),

  body("certificateNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Certificate number cannot exceed 80 characters"),

  body("issueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Issue date must be valid"),

  body("relatedBeltTest")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid belt test ID"),

  body("relatedChampionshipRecord")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid championship record ID"),
];

export const updateCertificateStatusValidator = [
  param("id").isMongoId().withMessage("Invalid certificate ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["issued", "cancelled"])
    .withMessage("Status must be issued or cancelled"),
];