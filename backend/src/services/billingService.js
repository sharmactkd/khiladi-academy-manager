import Academy from "../models/Academy.js";
import Plan from "../models/Plan.js";
import Coupon from "../models/Coupon.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import { createInvoiceForPayment } from "./invoiceService.js";

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const validateCouponForPlan = async ({
  couponCode,
  planCode,
  academyId,
}) => {
  if (!couponCode) {
    return {
      valid: false,
      coupon: null,
      message: "Coupon code is required",
    };
  }

  const coupon = await Coupon.findOne({
    code: String(couponCode).trim().toUpperCase(),
  });

  if (!coupon) {
    return {
      valid: false,
      coupon: null,
      message: "Invalid coupon code",
    };
  }

  const now = new Date();

  if (!coupon.isActive) {
    return {
      valid: false,
      coupon,
      message: "Coupon is inactive",
    };
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return {
      valid: false,
      coupon,
      message: "Coupon is not active yet",
    };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return {
      valid: false,
      coupon,
      message: "Coupon has expired",
    };
  }

  if (
    coupon.maxRedemptions > 0 &&
    coupon.usedCount >= coupon.maxRedemptions
  ) {
    return {
      valid: false,
      coupon,
      message: "Coupon redemption limit reached",
    };
  }

  if (
    coupon.applicablePlanCodes.length > 0 &&
    !coupon.applicablePlanCodes.includes(planCode)
  ) {
    return {
      valid: false,
      coupon,
      message: "Coupon is not applicable on this plan",
    };
  }

  const previousUsage = await Payment.countDocuments({
    academy: academyId,
    status: "paid",
    "metadata.couponCode": coupon.code,
  });

  if (previousUsage >= coupon.perAcademyLimit) {
    return {
      valid: false,
      coupon,
      message: "Coupon already used for this academy",
    };
  }

  return {
    valid: true,
    coupon,
    message: "Coupon is valid",
  };
};

export const calculateBillingAmount = async ({
  plan,
  couponCode = "",
  academyId,
}) => {
  let discount = 0;
  let coupon = null;
  let freeMonths = 0;

  if (couponCode) {
    const validation = await validateCouponForPlan({
      couponCode,
      planCode: plan.code,
      academyId,
    });

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    coupon = validation.coupon;

    if (coupon.discountType === "percentage") {
      discount = Math.round((plan.price * coupon.discountValue) / 100);
    }

    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    if (coupon.discountType === "free_months") {
      freeMonths = coupon.freeMonths || 1;
      discount = plan.price;
    }
  }

  const finalAmount = Math.max(Number(plan.price || 0) - Number(discount || 0), 0);

  return {
    baseAmount: Number(plan.price || 0),
    discount,
    finalAmount,
    coupon,
    freeMonths,
  };
};

export const activateSubscription = async ({
  academy,
  plan,
  payment = null,
  source = "manual",
  createdBy = null,
  freeMonths = 0,
  status = "active",
}) => {
  const startDate = new Date();

  let months = 1;

  if (plan.billingCycle === "yearly") {
    months = 12;
  }

  if (plan.billingCycle === "custom") {
    months = 0;
  }

  if (freeMonths > 0) {
    months += freeMonths;
  }

  const endDate =
    status === "lifetime" || plan.billingCycle === "custom"
      ? null
      : addMonths(startDate, months);

  await Subscription.updateMany(
    { academy: academy._id || academy, isCurrent: true },
    {
      $set: {
        isCurrent: false,
        updatedBy: createdBy,
      },
    }
  );

  const subscription = await Subscription.create({
    academy: academy._id || academy,
    plan: plan._id,
    planCode: plan.code,
    status,
    startDate,
    endDate,
    nextBillingDate: endDate,
    billingCycle: plan.billingCycle,
    source,
    razorpayOrderId: payment?.razorpayOrderId || "",
    razorpayPaymentId: payment?.razorpayPaymentId || "",
    lastPayment: payment?._id || null,
    isCurrent: true,
    createdBy,
    updatedBy: createdBy,
  });

  if (payment) {
    payment.subscription = subscription._id;
    await payment.save();
  }

  const academyDoc =
    typeof academy.save === "function"
      ? academy
      : await Academy.findById(academy);

  if (academyDoc) {
    academyDoc.subscriptionStatus =
      status === "admin_granted" ? "active" : status;
    academyDoc.subscriptionPlan = plan.code;
    academyDoc.maxStudentsAllowed =
      plan.limits?.students === "unlimited" ? 999999 : Number(plan.limits?.students || 50);
    academyDoc.settings = {
      ...(academyDoc.settings || {}),
      allowParentPortal: Boolean(plan.limits?.parentPortal),
      defaultCurrency: plan.currency || "INR",
    };

    await academyDoc.save();
  }

  return subscription;
};

export const completePaidBilling = async ({
  academy,
  plan,
  payment,
  coupon = null,
  freeMonths = 0,
  billingUser,
  createdBy,
}) => {
  const subscription = await activateSubscription({
    academy,
    plan,
    payment,
    source: coupon ? "coupon" : "razorpay",
    createdBy,
    freeMonths,
    status: "active",
  });

  if (coupon) {
    coupon.usedCount += 1;
    coupon.updatedBy = createdBy;
    await coupon.save();
  }

  const invoice = await createInvoiceForPayment({
    academy,
    subscription,
    payment,
    plan,
    billingUser,
    createdBy,
  });

  return {
    subscription,
    invoice,
  };
};

export const getPlanByCodeOrThrow = async (planCode) => {
  const plan = await Plan.findOne({
    code: planCode,
    isActive: true,
  });

  if (!plan) {
    throw new Error("Plan not found or inactive");
  }

  return plan;
};