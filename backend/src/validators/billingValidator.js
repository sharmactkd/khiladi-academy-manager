import { body, param } from "express-validator";

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