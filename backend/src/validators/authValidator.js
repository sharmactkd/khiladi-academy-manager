import { body, param } from "express-validator";

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
    .trim()
    .notEmpty()
    .withMessage("Email is required")
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
    .equals("academy_owner")
    .withMessage("Only academy owners can register publicly"),
];

export const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or phone is required"),

  body("password").notEmpty().withMessage("Password is required"),
  body("mfaCode")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage("Enter a valid authenticator or recovery code"),
];

export const enableMfaValidator = [
  body("secret").trim().isLength({ min: 20, max: 128 }),
  body("code").trim().matches(/^\d{6}$/).withMessage("Enter a 6-digit code"),
];

export const disableMfaValidator = [
  body("password").notEmpty().withMessage("Password is required"),
  body("code").trim().isLength({ min: 6, max: 20 }),
];

export const sessionIdValidator = [
  param("sessionId").isUUID().withMessage("Invalid session identifier"),
];

export const googleLoginValidator = [
  body("googleToken")
    .trim()
    .notEmpty()
    .withMessage("Google token is required"),

  body("role")
    .optional()
    .equals("academy_owner")
    .withMessage("Only academy owners can register publicly"),
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

export const verifyEmailValidator = [
  body("token")
    .trim()
    .isLength({ min: 64, max: 64 })
    .isHexadecimal()
    .withMessage("A valid verification token is required"),
];

export const resendEmailVerificationValidator = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
];
