import mongoose from "mongoose";
import Academy from "../models/Academy.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import AddOnDefinition from "../models/AddOnDefinition.js";
import Entitlement from "../models/Entitlement.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";
import {
  activateSubscription,
  calculateBillingAmount,
  calculateCouponDiscount,
  completePaidBilling,
  getPlanByCodeOrThrow,
  validateCouponForPurchase,
} from "../services/billingService.js";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
  fetchRazorpayPayment,
} from "../services/razorpayService.js";
import { getAcademyUsage } from "../services/usageService.js";
import { getEffectiveSubscription } from "../services/planService.js";
import { createInvoiceForPayment } from "../services/invoiceService.js";
import {
  activateEntitlement,
  getAcademyEntitlementSnapshot,
  seedDefaultAddOns,
} from "../services/entitlementService.js";

const getOwnedAcademy = async (req) => {
  if (req.academyId) return Academy.findById(req.academyId);
  return Academy.findOne({ owner: req.user._id }).sort({ createdAt: 1 });
};

const createReceiptNumber = ({ academyId, planCode }) => {
  return `KHILADI-${String(academyId).slice(-6).toUpperCase()}-${planCode.toUpperCase()}-${Date.now()}`;
};

const billingError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getCompletedPaymentResult = async (payment, session = null) => {
  const [subscription, entitlement, invoice] = await Promise.all([
    payment.subscription
      ? Subscription.findById(payment.subscription).session(session)
      : Subscription.findOne({ lastPayment: payment._id }).session(session),
    Entitlement.findOne({ payment: payment._id }).session(session),
    Invoice.findOne({ payment: payment._id }).session(session),
  ]);
  return { payment, subscription, entitlement, invoice, idempotent: true };
};

const finalizeRazorpayPayment = async ({
  paymentId,
  orderId,
  billingUser,
  academyId = null,
  providerPayment = null,
}) => {
  const existing = await Payment.findOne({ razorpayOrderId: orderId }).populate("plan").populate("addOn");
  if (!existing) throw billingError("Payment order not found", 404);
  if (academyId && String(existing.academy) !== String(academyId)) {
    throw billingError("Payment order does not belong to this academy", 403);
  }
  if (existing.status === "paid") {
    if (existing.razorpayPaymentId !== paymentId) {
      throw billingError("Payment order has already been completed", 409);
    }
    return getCompletedPaymentResult(existing);
  }
  if (existing.status === "processing") {
    throw billingError("Payment verification is already in progress", 409);
  }
  if (existing.status !== "created") {
    throw billingError("Payment order is not eligible for verification", 409);
  }

  if (!providerPayment) {
    throw billingError("Razorpay payment confirmation is unavailable", 503);
  }
  if (providerPayment.id !== paymentId || providerPayment.order_id !== orderId) {
    throw billingError("Razorpay payment identity mismatch", 409);
  }
  if (providerPayment.status !== "captured") {
    throw billingError("Razorpay payment has not been captured", 409);
  }
  if (Number(providerPayment.amount) !== Math.round(Number(existing.amount) * 100)) {
    throw billingError("Razorpay payment amount mismatch", 409);
  }
  if (String(providerPayment.currency || "").toUpperCase() !== String(existing.currency).toUpperCase()) {
    throw billingError("Razorpay payment currency mismatch", 409);
  }

  let coupon = null;
  let freeMonths = Number(existing.metadata?.freeMonths || 0);
  const couponCode = existing.metadata?.couponCode || "";
  if (couponCode) {
    const validation = await validateCouponForPurchase({
      couponCode,
      purchaseType: existing.purchaseType,
      productCode: existing.purchaseType === "plan" ? existing.plan.code : existing.addOn.code,
      academyId: existing.academy,
      amount: Number(existing.metadata?.baseAmount ?? existing.amount),
    });
    if (!validation.valid) throw billingError(validation.message, 409);
    coupon = validation.coupon;
    freeMonths = Number(coupon.freeMonths || freeMonths || 0);
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOneAndUpdate(
        { _id: existing._id, status: "created" },
        {
          $set: {
            status: "processing",
            processingStartedAt: new Date(),
            razorpayPaymentId: paymentId,
            failureReason: "",
          },
        },
        { new: true, session, runValidators: true }
      ).populate("plan").populate("addOn");

      if (!payment) {
        const completed = await Payment.findById(existing._id).session(session).populate("plan");
        if (completed?.status === "paid" && completed.razorpayPaymentId === paymentId) {
          result = await getCompletedPaymentResult(completed, session);
          return;
        }
        throw billingError("Payment verification is already being processed", 409);
      }

      const academy = await Academy.findById(payment.academy).session(session);
      if (!academy) throw billingError("Academy not found", 404);

      payment.status = "paid";
      payment.paidAt = new Date();
      payment.processingStartedAt = null;
      await payment.save({ session });

      if (payment.purchaseType === "add_on") {
        if (!payment.addOn) throw billingError("Add-on definition is unavailable", 409);
        const quantity = Math.max(1, Number(payment.metadata?.quantity || 1));
        const entitlement = await activateEntitlement({
          ownerId: academy.owner,
          academyId: academy._id,
          addOn: payment.addOn,
          quantity,
          payment,
          source: "razorpay",
          actorId: billingUser?._id || payment.createdBy,
          session,
        });
        if (coupon) {
          const updatedCoupon = await Coupon.findOneAndUpdate(
            { _id: coupon._id, isActive: true, $or: [{ maxRedemptions: 0 }, { $expr: { $lt: ["$usedCount", "$maxRedemptions"] } }] },
            { $inc: { usedCount: 1 }, $set: { updatedBy: billingUser?._id || payment.createdBy } },
            { new: true, session }
          );
          if (!updatedCoupon) throw billingError("Coupon redemption limit reached", 409);
        }
        const invoice = await createInvoiceForPayment({
          academy,
          subscription: null,
          payment,
          plan: { name: payment.addOn.name, billingCycle: payment.addOn.billingCycle },
          billingUser,
          createdBy: billingUser?._id || payment.createdBy,
          lineItems: [{
            name: payment.addOn.name,
            description: `${payment.addOn.description} (${payment.addOn.billingCycle})`,
            amount: Number(payment.metadata?.unitPrice || payment.addOn.price),
            quantity,
            total: Number(payment.metadata?.baseAmount || payment.amount),
          }],
          session,
        });
        result = { payment, entitlement, invoice, idempotent: false };
      } else {
        const completed = await completePaidBilling({
          academy,
          plan: payment.plan,
          payment,
          coupon,
          freeMonths,
          billingUser,
          createdBy: billingUser?._id || payment.createdBy,
          session,
        });
        result = { payment, ...completed, idempotent: false };
      }
    });
  } finally {
    await session.endSession();
  }
  return result;
};

export const createBillingOrder = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);

  if (!academy) {
    return errorResponse(res, "Academy profile is required before billing", 400);
  }

  const idempotencyKey = req.body.idempotencyKey;
  const previousPayment = await Payment.findOne({ academy: academy._id, idempotencyKey })
    .populate("plan")
    .populate("subscription");
  if (previousPayment) {
    if (["creating", "failed", "refunded", "processing"].includes(previousPayment.status)) {
      return errorResponse(
        res,
        ["creating", "processing"].includes(previousPayment.status)
          ? "This billing request is already being processed"
          : "This billing request can no longer be reused. Start a new checkout.",
        409
      );
    }
    const invoice = await Invoice.findOne({ payment: previousPayment._id });
    return successResponse(res, "Existing billing request returned safely", {
      requiresPayment: ["creating", "created"].includes(previousPayment.status),
      payment: previousPayment,
      subscription: previousPayment.subscription || null,
      invoice,
      order: previousPayment.razorpayOrderId
        ? {
            id: previousPayment.razorpayOrderId,
            amount: Math.round(Number(previousPayment.amount) * 100),
            currency: previousPayment.currency,
            receipt: previousPayment.receipt,
          }
        : null,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      idempotent: true,
    });
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
    const session = await mongoose.startSession();
    let payment;
    let subscription;
    let invoice;
    try {
      await session.withTransaction(async () => {
        [payment] = await Payment.create([{
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
          idempotencyKey,
        }], { session });

        subscription = await activateSubscription({
          academy,
          plan,
          payment,
          source: billing.coupon ? "coupon" : "free",
          createdBy: req.user._id,
          freeMonths: billing.freeMonths,
          status: "active",
          session,
        });

        if (billing.coupon) {
          const updatedCoupon = await Coupon.findOneAndUpdate(
            {
              _id: billing.coupon._id,
              isActive: true,
              $or: [
                { maxRedemptions: 0 },
                { $expr: { $lt: ["$usedCount", "$maxRedemptions"] } },
              ],
            },
            { $inc: { usedCount: 1 }, $set: { updatedBy: req.user._id } },
            { new: true, session }
          );
          if (!updatedCoupon) throw billingError("Coupon redemption limit reached", 409);
        }

        invoice = await createInvoiceForPayment({
          academy,
          subscription,
          payment,
          plan,
          billingUser: req.user,
          createdBy: req.user._id,
          session,
        });
      });
    } finally {
      await session.endSession();
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

  const payment = await Payment.create({
    academy: academy._id,
    plan: plan._id,
    amount: billing.finalAmount,
    currency: plan.currency || "INR",
    status: "creating",
    provider: "razorpay",
    receipt,
    metadata: {
      planCode: plan.code,
      couponCode: billing.coupon?.code || "",
      baseAmount: billing.baseAmount,
      discount: billing.discount,
      freeMonths: billing.freeMonths,
    },
    createdBy: req.user._id,
    idempotencyKey,
  });

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amount: billing.finalAmount,
      currency: plan.currency || "INR",
      receipt,
      notes: {
        academyId: String(academy._id),
        planCode: plan.code,
        couponCode: billing.coupon?.code || "",
      },
    });
    payment.razorpayOrderId = razorpayOrder.id;
    payment.status = "created";
    await payment.save();
  } catch (error) {
    payment.status = "failed";
    payment.failureReason = String(error.message || "Razorpay order creation failed").slice(0, 240);
    await payment.save({ validateBeforeSave: false });
    throw error;
  }

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

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

  if (!payment) {
    return errorResponse(res, "Payment order not found or already processed", 404);
  }

  if (String(payment.academy) !== String(req.academyId)) {
    return errorResponse(res, "You cannot verify payment for this academy", 403);
  }

  const isValidSignature = verifyRazorpaySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!isValidSignature) {
    return errorResponse(res, "Invalid Razorpay payment signature", 400);
  }

  const result = await finalizeRazorpayPayment({
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    billingUser: req.user,
    academyId: req.academyId,
    providerPayment: await fetchRazorpayPayment(razorpay_payment_id),
  });

  if (!result.idempotent) {
    result.payment.razorpaySignature = razorpay_signature;
    await result.payment.save();
  }

  return successResponse(res, "Payment verified and subscription activated", {
    ...result,
  });
});

export const razorpayBillingWebhook = asyncHandler(async (req, res) => {
  const signature = req.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhookSignature({ rawBody: req.rawBody, signature })) {
    return errorResponse(res, "Invalid Razorpay webhook signature", 401);
  }

  if (req.body?.event !== "payment.captured") {
    return successResponse(res, "Razorpay event acknowledged", { ignored: true });
  }

  const entity = req.body?.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;
  if (!orderId || !paymentId) return errorResponse(res, "Invalid payment webhook payload", 400);

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment) return errorResponse(res, "Payment order not found", 404);
  if (Number(entity.amount) !== Math.round(Number(payment.amount) * 100)) {
    return errorResponse(res, "Webhook payment amount mismatch", 409);
  }
  if (String(entity.currency || "").toUpperCase() !== String(payment.currency).toUpperCase()) {
    return errorResponse(res, "Webhook payment currency mismatch", 409);
  }

  const billingUser = await User.findById(payment.createdBy);
  const result = await finalizeRazorpayPayment({
    paymentId,
    orderId,
    billingUser,
    providerPayment: entity,
  });
  return successResponse(res, "Razorpay payment webhook processed", {
    paymentId: result.payment._id,
    idempotent: result.idempotent,
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

  const entitlementSnapshot = await getAcademyEntitlementSnapshot({
    ownerId: academy.owner,
    academyId: academy._id,
  });

  return successResponse(res, "Subscription fetched successfully", {
    academy,
    subscription,
    plan: subscription.plan,
    usage,
    entitlements: entitlementSnapshot.entitlements,
    effectiveLimits: entitlementSnapshot.limits,
  });
});

export const getBillingAddOns = asyncHandler(async (req, res) => {
  let addOns = await AddOnDefinition.find({ isActive: true }).sort({ sortOrder: 1 });
  if (!addOns.length) addOns = await seedDefaultAddOns({ userId: req.user?._id || null });
  return successResponse(res, "Billing add-ons fetched successfully", { addOns });
});

export const seedBillingAddOns = asyncHandler(async (req, res) => {
  const addOns = await seedDefaultAddOns({ userId: req.user._id });
  return successResponse(res, "Default billing add-ons seeded", { addOns });
});

export const createAddOnOrder = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);
  if (!academy) return errorResponse(res, "Academy profile is required before billing", 400);
  const addOn = await AddOnDefinition.findOne({ code: req.body.addOnCode, isActive: true });
  if (!addOn) return errorResponse(res, "Add-on not found or inactive", 404);
  const quantity = addOn.stackable ? Math.max(1, Math.min(100, Number(req.body.quantity || 1))) : 1;
  const idempotencyKey = req.body.idempotencyKey;
  const previous = await Payment.findOne({ academy: academy._id, idempotencyKey }).populate("addOn");
  if (previous) {
    const invoice = await Invoice.findOne({ payment: previous._id });
    return successResponse(res, "Existing add-on billing request returned safely", {
      requiresPayment: previous.status !== "paid",
      payment: previous,
      invoice,
      order: previous.razorpayOrderId ? { id: previous.razorpayOrderId, amount: Math.round(previous.amount * 100), currency: previous.currency, receipt: previous.receipt } : null,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      idempotent: true,
    });
  }
  const baseAmount = Number(addOn.price) * quantity;
  let coupon = null;
  let discount = 0;
  if (req.body.couponCode) {
    const validation = await validateCouponForPurchase({ couponCode: req.body.couponCode, purchaseType: "add_on", productCode: addOn.code, academyId: academy._id, amount: baseAmount });
    if (!validation.valid) return errorResponse(res, validation.message, 400);
    coupon = validation.coupon;
    discount = calculateCouponDiscount({ coupon, amount: baseAmount });
  }
  const amount = Math.max(0, baseAmount - discount);
  const receipt = createReceiptNumber({ academyId: academy._id, planCode: addOn.code });
  if (amount <= 0) {
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const [payment] = await Payment.create([{ academy: academy._id, addOn: addOn._id, purchaseType: "add_on", amount: 0, currency: addOn.currency, status: "paid", provider: "razorpay", receipt, metadata: { addOnCode: addOn.code, quantity, unitPrice: addOn.price, priceVersion: addOn.version, couponCode: coupon?.code || "", baseAmount, discount, zeroAmountActivation: true }, paidAt: new Date(), createdBy: req.user._id, idempotencyKey }], { session });
        const entitlement = await activateEntitlement({ ownerId: academy.owner, academyId: academy._id, addOn, quantity, payment, source: "coupon", actorId: req.user._id, session });
        const updatedCoupon = await Coupon.findOneAndUpdate({ _id: coupon._id, isActive: true, $or: [{ maxRedemptions: 0 }, { $expr: { $lt: ["$usedCount", "$maxRedemptions"] } }] }, { $inc: { usedCount: 1 }, $set: { updatedBy: req.user._id } }, { new: true, session });
        if (!updatedCoupon) throw billingError("Coupon redemption limit reached", 409);
        const invoice = await createInvoiceForPayment({ academy, subscription: null, payment, plan: { name: addOn.name, billingCycle: addOn.billingCycle }, billingUser: req.user, createdBy: req.user._id, lineItems: [{ name: addOn.name, description: addOn.description, amount: Number(addOn.price), quantity, total: baseAmount }], session });
        result = { requiresPayment: false, payment, entitlement, invoice, amountBreakup: { baseAmount, discount, finalAmount: 0 } };
      });
    } finally { await session.endSession(); }
    return successResponse(res, "Add-on activated successfully", result);
  }
  if (!isRazorpayConfigured()) return errorResponse(res, "Razorpay is not configured", 503);
  const payment = await Payment.create({
    academy: academy._id,
    addOn: addOn._id,
    purchaseType: "add_on",
    amount,
    currency: addOn.currency,
    status: "creating",
    provider: "razorpay",
    receipt,
    metadata: { addOnCode: addOn.code, quantity, unitPrice: addOn.price, priceVersion: addOn.version, couponCode: coupon?.code || "", baseAmount, discount },
    createdBy: req.user._id,
    idempotencyKey,
  });
  try {
    const order = await createRazorpayOrder({ amount, currency: addOn.currency, receipt, notes: { academyId: String(academy._id), purchaseType: "add_on", addOnCode: addOn.code, quantity: String(quantity) } });
    payment.razorpayOrderId = order.id;
    payment.status = "created";
    await payment.save();
    return successResponse(res, "Add-on payment order created", { requiresPayment: true, razorpayKeyId: env.RAZORPAY_KEY_ID, order, payment, addOn, quantity, amountBreakup: { baseAmount, discount, finalAmount: amount } });
  } catch (error) {
    payment.status = "failed";
    payment.failureReason = String(error.message || "Order creation failed").slice(0, 240);
    await payment.save({ validateBeforeSave: false });
    throw error;
  }
});

export const verifyAddOnPayment = verifyBillingPayment;

export const cancelEntitlement = asyncHandler(async (req, res) => {
  const academy = await getOwnedAcademy(req);
  const entitlement = await Entitlement.findOne({
    _id: req.params.id,
    owner: academy.owner,
    $or: [{ academy: academy._id }, { academy: null }],
    status: { $in: ["active", "grace"] },
  });
  if (!entitlement) return errorResponse(res, "Active entitlement not found", 404);
  entitlement.autoRenew = false;
  entitlement.cancellationReason = String(req.body.reason || "Cancelled by owner").slice(0, 500);
  entitlement.updatedBy = req.user._id;
  await entitlement.save();
  return successResponse(res, "Add-on auto-renewal cancelled; access remains until period end", { entitlement });
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
    .populate("addOn", "name code price billingCycle")
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
  academy.maxStudentsAllowed = 100;
  academy.settings = {
    ...(academy.settings || {}),
    allowParentPortal: false,
  };

  await academy.save();

  return successResponse(res, "Subscription cancelled successfully", {
    subscription,
  });
});
