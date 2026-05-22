import { body } from "express-validator";

const allowedPublicRoles = [
  "academy_owner",
  "assistant_coach",
  "parent",
  "student",
];

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

const phoneRegex = /^[0-9]{10,15}$/;

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(phoneRegex)
    .withMessage("Phone must be 10 to 15 digits"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(passwordRegex)
    .withMessage(
      "Password must be 8-72 characters and include uppercase, lowercase, number, and special character"
    ),

  body("role")
    .optional()
    .isIn(allowedPublicRoles)
    .withMessage("Invalid role for public registration"),
];

export const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or phone is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

export const googleLoginValidator = [
  body("googleToken")
    .trim()
    .notEmpty()
    .withMessage("Google token is required"),

  body("role")
    .optional()
    .isIn(allowedPublicRoles)
    .withMessage("Invalid role for Google registration"),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(passwordRegex)
    .withMessage(
      "Password must be 8-72 characters and include uppercase, lowercase, number, and special character"
    ),
];