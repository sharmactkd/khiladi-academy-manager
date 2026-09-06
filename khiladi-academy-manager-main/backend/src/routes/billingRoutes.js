import express from "express";
import {
  createBillingOrder,
  verifyBillingPayment,
  getMySubscription,
  getBillingPayments,
  getBillingInvoices,
  getBillingInvoiceById,
  cancelSubscription,
  razorpayBillingWebhook,
} from "../controllers/billingController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createOrderValidator,
  verifyPaymentValidator,
  invoiceIdValidator,
  billingIdempotencyValidator,
} from "../validators/billingValidator.js";
import { tournamentWebhookRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/webhook/razorpay", tournamentWebhookRateLimiter, razorpayBillingWebhook);

router.use(protect);
router.use(allowRoles("academy_owner", "super_admin"));
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router.post(
  "/create-order",
  billingIdempotencyValidator,
  createOrderValidator,
  validateRequest,
  createBillingOrder
);

router.post(
  "/verify-payment",
  verifyPaymentValidator,
  validateRequest,
  verifyBillingPayment
);

router.get("/my-subscription", getMySubscription);
router.get("/payments", getBillingPayments);
router.get("/invoices", getBillingInvoices);

router.get(
  "/invoices/:id",
  invoiceIdValidator,
  validateRequest,
  getBillingInvoiceById
);

router.post("/cancel-subscription", cancelSubscription);

export default router;
