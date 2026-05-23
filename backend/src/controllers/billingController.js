import Academy from "../models/Academy.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";
import {
  activateSubscription,
  calculateBillingAmount,
  completePaidBilling,
  getPlanByCodeOrThrow,
} from "../services/billingService.js";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { getAcademyUsage } from "../services/usageService.js";
import { getEffectiveSubscription } from "../services/planService.js";
import { createInvoiceForPayment } from "../services/invoiceService.js";

const getOwnedAcademy = async (req) => {
  if (req.user.role === "super_admin" && req.academyId) {
    return Academy.findById(req.academyId);
  }

  return Academy.findOne({
    owner: req.user._id,
  });
};

const createReceiptNumber = ({ academyId, planCode }) => {
  return `KHILADI-${String(academyId).slice(-6).toUpperCase()}-${planCode.toUpperCase()}-${Date.now()}`;
};

export const createBillingOrder = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile is required before billing", 400);
  }

  const plan = await getPlanByCodeOrThrow(req.body.planCode);

  const billing = await calculateBillingAmount({
    plan,
    couponCode: req.body.couponCode || "",
    academyId: academy._id,
  });

  const receipt = createReceiptNumber({
    academyId: academy._id,
    planCode: plan.code,
  });

  if (plan.code === "free" || billing.finalAmount <= 0) {
    const payment = await Payment.create({
      academy: academy._id,
      plan: plan._id,
      amount: 0,
      currency: plan.currency || "INR",
      status: "paid",
      provider: "razorpay",
      receipt,
      metadata: {
        planCode: plan.code,
        couponCode: billing.coupon?.code || "",
        baseAmount: billing.baseAmount,
        discount: billing.discount,
        zeroAmountActivation: true,
      },
      paidAt: new Date(),
      createdBy: req.user._id,
    });

    const subscription = await activateSubscription({
      academy,
      plan,
      payment,
      source: billing.coupon ? "coupon" : "free",
      createdBy: req.user._id,
      freeMonths: billing.freeMonths,
      status: "active",
    });

    const invoice = await createInvoiceForPayment({
      academy,
      subscription,
      payment,
      plan,
      billingUser: req.user,
      createdBy: req.user._id,
    });

    if (billing.coupon) {
      billing.coupon.usedCount += 1;
      billing.coupon.updatedBy = req.user._id;
      await billing.coupon.save();
    }

    return successResponse(res, "Subscription activated successfully", {
      requiresPayment: false,
      payment,
      subscription,
      invoice,
    });
  }

  if (!isRazorpayConfigured()) {
    return errorResponse(
      res,
      "Razorpay is not configured. Please add Razorpay keys in backend .env",
      500
    );
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: billing.finalAmount,
    currency: plan.currency || "INR",
    receipt,
    notes: {
      academyId: String(academy._id),
      planCode: plan.code,
      couponCode: billing.coupon?.code || "",
    },
  });

  const payment = await Payment.create({
    academy: academy._id,
    plan: plan._id,
    amount: billing.finalAmount,
    currency: plan.currency || "INR",
    status: "created",
    provider: "razorpay",
    razorpayOrderId: razorpayOrder.id,
    receipt,
    metadata: {
      planCode: plan.code,
      couponCode: billing.coupon?.code || "",
      baseAmount: billing.baseAmount,
      discount: billing.discount,
      freeMonths: billing.freeMonths,
    },
    createdBy: req.user._id,
  });

  return successResponse(res, "Razorpay order created successfully", {
    requiresPayment: true,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    order: razorpayOrder,
    payment,
    plan,
    amountBreakup: {
      baseAmount: billing.baseAmount,
      discount: billing.discount,
      finalAmount: billing.finalAmount,
    },
  });
});

export const verifyBillingPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    status: "created",
  }).populate("plan");

  if (!payment) {
    return errorResponse(res, "Payment order not found or already processed", 404);
  }

  const academy = await Academy.findById(payment.academy);

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  if (
    req.user.role !== "super_admin" &&
    String(academy.owner) !== String(req.user._id)
  ) {
    return errorResponse(res, "You cannot verify payment for this academy", 403);
  }

  const isValidSignature = verifyRazorpaySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!isValidSignature) {
    payment.status = "failed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    return errorResponse(res, "Invalid Razorpay payment signature", 400);
  }

  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paidAt = new Date();

  await payment.save();

  const couponCode = payment.metadata?.couponCode || "";
  let coupon = null;
  let freeMonths = Number(payment.metadata?.freeMonths || 0);

  if (couponCode) {
    const { validateCouponForPlan } = await import("../services/billingService.js");
    const validation = await validateCouponForPlan({
      couponCode,
      planCode: payment.plan.code,
      academyId: academy._id,
    });

    if (validation.valid) {
      coupon = validation.coupon;
      freeMonths = Number(coupon.freeMonths || freeMonths || 0);
    }
  }

  const { subscription, invoice } = await completePaidBilling({
    academy,
    plan: payment.plan,
    payment,
    coupon,
    freeMonths,
    billingUser: req.user,
    createdBy: req.user._id,
  });

  return successResponse(res, "Payment verified and subscription activated", {
    payment,
    subscription,
    invoice,
  });
});

export const getMySubscription = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile not found", 404);
  }

  const subscription = await getEffectiveSubscription({
    academyId: academy._id,
  });

  const usage = await getAcademyUsage({
    academyId: academy._id,
  });

  return successResponse(res, "Subscription fetched successfully", {
    academy,
    subscription,
    plan: subscription.plan,
    usage,
  });
});

export const getBillingPayments = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile not found", 404);
  }

  const payments = await Payment.find({
    academy: academy._id,
  })
    .sort({ createdAt: -1 })
    .populate("plan", "name code price billingCycle")
    .populate("subscription");

  return successResponse(res, "Payments fetched successfully", { payments });
});

export const getBillingInvoices = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile not found", 404);
  }

  const invoices = await Invoice.find({
    academy: academy._id,
  })
    .sort({ createdAt: -1 })
    .populate("payment")
    .populate("subscription");

  return successResponse(res, "Invoices fetched successfully", { invoices });
});

export const getBillingInvoiceById = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile not found", 404);
  }

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    academy: academy._id,
  })
    .populate("payment")
    .populate("subscription");

  if (!invoice) {
    return errorResponse(res, "Invoice not found", 404);
  }

  return successResponse(res, "Invoice fetched successfully", { invoice });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile not found", 404);
  }

  const subscription = await Subscription.findOne({
    academy: academy._id,
    isCurrent: true,
  });

  if (!subscription) {
    return errorResponse(res, "Current subscription not found", 404);
  }

  subscription.status = "cancelled";
  subscription.isCurrent = false;
  subscription.cancelledAt = new Date();
  subscription.updatedBy = req.user._id;

  await subscription.save();

  academy.subscriptionStatus = "cancelled";
  academy.subscriptionPlan = "free";
  academy.maxStudentsAllowed = 50;
  academy.settings = {
    ...(academy.settings || {}),
    allowParentPortal: false,
  };

  await academy.save();

  return successResponse(res, "Subscription cancelled successfully", {
    subscription,
  });
});