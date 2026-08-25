import { body, param, query } from "express-validator";

const phoneRegex = /^[0-9\s()+-]{1,25}$/;

const phoneValidator = (field, label, countryCodeField) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .matches(phoneRegex)
    .withMessage(`${label} contains unsupported characters`)
    .custom((value, { req }) => {
      const digits = String(value || "").replace(/\D/g, "");
      const countryCode = String(req.body?.[countryCodeField] || "+91");

      if (countryCode === "+91" && digits.length !== 10) {
        throw new Error(`${label} must contain exactly 10 digits for India`);
      }
      if (countryCode !== "+91" && (digits.length < 4 || digits.length > 15)) {
        throw new Error(`${label} must contain 4 to 15 digits`);
      }

      return true;
    });

const contactArrayValidator = (field, label) =>
  body(field).optional().custom((value) => {
    let contacts = value;
    if (typeof contacts === "string") {
      try { contacts = JSON.parse(contacts); } catch { throw new Error(`${label} must be valid JSON`); }
    }
    if (!Array.isArray(contacts) || contacts.length > 6) {
      throw new Error(`${label} must contain at most 6 contacts`);
    }
    const valid = contacts.every((contact) =>
      contact && typeof contact === "object" &&
      String(contact.name || "").length <= 150 &&
      String(contact.relation || "").length <= 80 &&
      (!contact.phone || (() => {
        const length = String(contact.phone).replace(/\D/g, "").length;
        return length >= 4 && length <= 15;
      })())
    );
    if (!valid) throw new Error(`${label} contains invalid contact details`);
    return true;
  });

export const studentIdValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),
];

export const createStudentValidator = [
  body("admissionNumber")
    .optional({ checkFalsy: true })
    .trim()
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
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("DOB must be a valid date"),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").isIn(["male", "female", "other"]).withMessage("Invalid gender"),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),

  phoneValidator("phone", "Phone", "countryCode"),
  phoneValidator("emergencyContactPhone", "Emergency contact phone", "emergencyContactCountryCode"),
  contactArrayValidator("parentContacts", "Parent contacts"),
  contactArrayValidator("emergencyContacts", "Emergency contacts"),

  body("schoolName")
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max: 200 })
  .withMessage("School name cannot exceed 200 characters"),
  
  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const updateStudentValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),

  body("admissionNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Admission number cannot exceed 40 characters"),

  body("firstName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),

  body("lastName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Last name cannot exceed 100 characters"),

  body("batch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),

  body("dateOfBirth")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("DOB must be a valid date"),

  body("joiningDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Joining date must be a valid date"),

  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),

  phoneValidator("phone", "Phone", "countryCode"),
  phoneValidator("parentPhone", "Parent phone", "parentCountryCode"),
  phoneValidator("emergencyContactPhone", "Emergency contact phone", "emergencyContactCountryCode"),
  contactArrayValidator("parentContacts", "Parent contacts"),
  contactArrayValidator("emergencyContacts", "Emergency contacts"),

  body("schoolName")
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max: 200 })
  .withMessage("School name cannot exceed 200 characters"),

  body("status").optional().isIn(["active", "inactive", "left"]),
];

export const listStudentsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(["active", "inactive", "left"]),
  query("batch").optional({ checkFalsy: true }).isMongoId(),
];
