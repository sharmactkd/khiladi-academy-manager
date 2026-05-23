import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { getPlanByCodeOrThrow, validateCouponForPlan } from "../services/billingService.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const plan = await getPlanByCodeOrThrow(req.body.planCode);

  const validation = await validateCouponForPlan({
    couponCode: req.body.couponCode,
    planCode: plan.code,
    academyId: req.academyId,
  });

  if (!validation.valid) {
    return errorResponse(res, validation.message, 400);
  }

  return successResponse(res, "Coupon validated successfully", {
    coupon: validation.coupon,
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
    "description",
    "discountType",
    "discountValue",
    "freeMonths",
    "applicablePlanCodes",
    "maxRedemptions",
    "perAcademyLimit",
    "startsAt",
    "expiresAt",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      coupon[field] = req.body[field];
    }
  });

  coupon.updatedBy = req.user._id;

  await coupon.save();

  return successResponse(res, "Coupon updated successfully", { coupon });
});