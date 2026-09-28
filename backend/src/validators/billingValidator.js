import { body, param } from "express-validator";

export const billingIdempotencyValidator = [
  body("idempotencyKey")
    .trim()
    .isUUID()
    .withMessage("A valid idempotency key is required"),
];

export const createOrderValidator = [
  body("planCode")
    .trim()
    .isIn(["free", "basic", "pro", "premium", "enterprise"])
    .withMessage("Invalid plan code"),

  body("couponCode")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Coupon code cannot exceed 50 characters"),
];

export const verifyPaymentValidator = [
  body("razorpay_order_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay order ID is required"),

  body("razorpay_payment_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay payment ID is required"),

  body("razorpay_signature")
    .trim()
    .notEmpty()
    .withMessage("Razorpay signature is required"),
];

export const invoiceIdValidator = [
  param("id").isMongoId().withMessage("Invalid invoice ID"),
];

export const createAddOnOrderValidator = [
  body("addOnCode")
    .trim()
    .isIn(["student_capacity_500", "additional_academy", "additional_branch", "id_card_studio", "certificate_studio", "document_studio_bundle"])
    .withMessage("Invalid add-on code"),
  body("quantity").optional().isInt({ min: 1, max: 100 }).withMessage("Quantity must be between 1 and 100"),
  body("couponCode").optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 50 }).withMessage("Invalid coupon code"),
];

export const entitlementIdValidator = [
  param("id").isMongoId().withMessage("Invalid entitlement ID"),
  body("reason").optional().trim().isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
];
