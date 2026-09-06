import { body, param, query } from "express-validator";

export const parentLinkIdValidator = [
  param("id").isMongoId().withMessage("Invalid parent link ID"),
];

export const parentLinkStudentIdValidator = [
  param("studentId").isMongoId().withMessage("Invalid student ID"),
];

export const createParentLinkValidator = [
  body("student").isMongoId().withMessage("Valid student is required"),
  body("guardianUser")
    .isMongoId()
    .withMessage("Valid guardian user is required"),
  body("relationship")
    .optional()
    .isIn(["father", "mother", "guardian", "self", "other"])
    .withMessage("Invalid relationship"),
  body("canViewAttendance").optional().isBoolean(),
  body("canViewFees").optional().isBoolean(),
  body("canViewProgress").optional().isBoolean(),
  body("canViewDocuments").optional().isBoolean(),
  body("isPrimary").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

export const updateParentLinkValidator = [
  param("id").isMongoId().withMessage("Invalid parent link ID"),
  body("relationship")
    .optional()
    .isIn(["father", "mother", "guardian", "self", "other"])
    .withMessage("Invalid relationship"),
  body("canViewAttendance").optional().isBoolean(),
  body("canViewFees").optional().isBoolean(),
  body("canViewProgress").optional().isBoolean(),
  body("canViewDocuments").optional().isBoolean(),
  body("isPrimary").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

export const listParentLinksValidator = [
  query("student").optional({ checkFalsy: true }).isMongoId(),
  query("guardianUser").optional({ checkFalsy: true }).isMongoId(),
  query("isActive").optional({ checkFalsy: true }).isBoolean(),
];