import { body } from "express-validator";

const phoneRegex = /^[0-9-]{1,15}$/;
const indiaPhoneRegex = /^[0-9]{10}$/;
const indiaPhoneDisplayRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{4}$/;
const countryCodeRegex = /^\+[0-9]{1,6}$/;

const stringField = (field, max, label) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max })
    .withMessage(`${label} cannot exceed ${max} characters`);

const phoneValidator = body("phone")
  .optional({ checkFalsy: true })
  .trim()
  .matches(phoneRegex)
  .withMessage("Phone must contain numbers and hyphen only")
  .custom((value, { req }) => {
    const phone = String(value || "").trim();
    const normalizedPhone = phone.replace(/-/g, "");

    if (req.body.countryCode === "+91") {
      const isValidDisplayFormat = indiaPhoneDisplayRegex.test(phone);
      const isValidDigits = indiaPhoneRegex.test(normalizedPhone);

      if (!isValidDisplayFormat || !isValidDigits) {
        throw new Error("India phone number must be in format 0000-00-0000");
      }
    }

    return true;
  });

const countryCodeValidator = body("countryCode")
  .optional({ checkFalsy: true })
  .trim()
  .matches(countryCodeRegex)
  .withMessage("Country code must be valid, for example +91");

export const createAcademyValidator = [
  body("academyName")
    .trim()
    .notEmpty()
    .withMessage("Academy name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Academy name must be between 2 and 120 characters"),

  body("martialArts")
    .isArray({ min: 1 })
    .withMessage("Martial arts must be an array with at least one item"),

  body("martialArts.*")
    .trim()
    .notEmpty()
    .withMessage("Martial art name cannot be empty")
    .isLength({ max: 60 })
    .withMessage("Martial art name cannot exceed 60 characters"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid academy email")
    .normalizeEmail(),

  countryCodeValidator,
  phoneValidator,

  stringField("logo", 500, "Logo"),
  stringField("address", 500, "Address"),
  stringField("city", 80, "District"),
  stringField("state", 80, "State"),
  stringField("country", 80, "Country"),
  stringField("pincode", 12, "Pincode"),

  body("branchesEnabled")
    .optional()
    .isBoolean()
    .withMessage("branchesEnabled must be true or false"),

  body("settings")
    .optional()
    .isObject()
    .withMessage("Settings must be an object"),

  body("settings.allowParentPortal")
    .optional()
    .isBoolean()
    .withMessage("allowParentPortal must be true or false"),

  body("settings.allowOnlineAdmission")
    .optional()
    .isBoolean()
    .withMessage("allowOnlineAdmission must be true or false"),

  body("settings.defaultCurrency")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Default currency must be a 3-letter code"),

  body("settings.timezone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Timezone cannot exceed 80 characters"),
];

export const updateAcademyValidator = [
  body("academyName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Academy name must be between 2 and 120 characters"),

  body("martialArts")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Martial arts must be an array with at least one item"),

  body("martialArts.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Martial art name cannot be empty")
    .isLength({ max: 60 })
    .withMessage("Martial art name cannot exceed 60 characters"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid academy email")
    .normalizeEmail(),

  countryCodeValidator,
  phoneValidator,

  stringField("logo", 500, "Logo"),
  stringField("address", 500, "Address"),
  stringField("city", 80, "District"),
  stringField("state", 80, "State"),
  stringField("country", 80, "Country"),
  stringField("pincode", 12, "Pincode"),

  body("branchesEnabled")
    .optional()
    .isBoolean()
    .withMessage("branchesEnabled must be true or false"),

  body("settings")
    .optional()
    .isObject()
    .withMessage("Settings must be an object"),

  body("settings.allowParentPortal")
    .optional()
    .isBoolean()
    .withMessage("allowParentPortal must be true or false"),

  body("settings.allowOnlineAdmission")
    .optional()
    .isBoolean()
    .withMessage("allowOnlineAdmission must be true or false"),

  body("settings.defaultCurrency")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Default currency must be a 3-letter code"),

  body("settings.timezone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Timezone cannot exceed 80 characters"),
];