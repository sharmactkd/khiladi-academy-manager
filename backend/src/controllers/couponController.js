import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import AddOnDefinition from "../models/AddOnDefinition.js";
import { calculateCouponDiscount, getPlanByCodeOrThrow, validateCouponForPurchase } from "../services/billingService.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const purchaseType = req.body.addOnCode ? "add_on" : "plan";
  const product = purchaseType === "plan"
    ? await getPlanByCodeOrThrow(req.body.planCode)
    : await AddOnDefinition.findOne({ code: req.body.addOnCode, isActive: true });
  if (!product) return errorResponse(res, "Billing product not found", 404);
  const quantity = purchaseType === "add_on" && product.stackable ? Math.max(1, Math.min(100, Number(req.body.quantity || 1))) : 1;
  const baseAmount = Number(product.price || 0) * quantity;
  const validation = await validateCouponForPurchase({
    couponCode: req.body.couponCode,
    purchaseType,
    productCode: product.code,
    academyId: req.academyId,
    amount: baseAmount,
  });

  if (!validation.valid) {
    return errorResponse(res, validation.message, 400);
  }

  return successResponse(res, "Coupon validated successfully", {
    coupon: validation.coupon,
    amountBreakup: { baseAmount, discount: calculateCouponDiscount({ coupon: validation.coupon, amount: baseAmount }), finalAmount: baseAmount - calculateCouponDiscount({ coupon: validation.coupon, amount: baseAmount }) },
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: String(req.body.code).trim().toUpperCase(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Coupon created successfully", { coupon }, 201);
});

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });

  return successResponse(res, "Coupons fetched successfully", { coupons });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return errorResponse(res, "Coupon not found", 404);
  }

  const allowedFields = [
    "code",
    "description",
    "discountType",
    "discountValue",
    "freeMonths",
    "applicablePlanCodes",
    "applicableAddOnCodes",
    "appliesTo",
    "minimumAmount",
    "maximumDiscount",
    "maxRedemptions",
    "perAcademyLimit",
    "startsAt",
    "expiresAt",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      coupon[field] = field === "code" ? String(req.body[field]).trim().toUpperCase() : req.body[field];
    }
  });

  coupon.updatedBy = req.user._id;

  await coupon.save();

  return successResponse(res, "Coupon updated successfully", { coupon });
});
