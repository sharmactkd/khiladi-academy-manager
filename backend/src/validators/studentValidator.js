import { body, param, query } from "express-validator";

const phoneRegex = /^[0-9-]{1,15}$/;
const indiaPhoneRegex = /^[0-9]{10}$/;
const indiaPhoneDisplayRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{4}$/;

const phoneValidator = (field, label) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .matches(phoneRegex)
    .withMessage(`${label} must contain numbers and hyphen only`)
    .custom((value) => {
      const phone = String(value || "").trim();
      const normalizedPhone = phone.replace(/-/g, "");

      const isValidDisplayFormat = indiaPhoneDisplayRegex.test(phone);
      const isValidDigits = indiaPhoneRegex.test(normalizedPhone);

      if (!isValidDisplayFormat || !isValidDigits) {
        throw new Error(`${label} must be in format 0000-00-0000`);
      }

      return true;
    });

export const studentIdValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),
];

export const createStudentValidator = [
  body("admissionNumber")
    .trim()
    .notEmpty()
    .withMessage("Admission number is required")
    .isLength({ max: 40 })
    .withMessage("Admission number cannot exceed 40 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),

  body("lastName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Last name cannot exceed 100 characters"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("DOB is required")
    .isISO8601()
    .withMessage("DOB must be a valid date"),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").isIn(["male", "female", "other"]).withMessage("Invalid gender"),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),

  phoneValidator("phone", "Phone"),
  phoneValidator("emergencyContactPhone", "Emergency contact phone"),

  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const updateStudentValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),
  body("studentCode").optional().trim().notEmpty(),
  body("name").optional().trim().isLength({ min: 2, max: 100 }),
  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("dob").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),

  phoneValidator("phone", "Phone"),
  
  phoneValidator("emergencyContactPhone", "Emergency contact phone"),

  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const listStudentsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(["active", "inactive", "left"]),
  query("batch").optional({ checkFalsy: true }).isMongoId(),
];