import Plan from "../models/Plan.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { seedDefaultPlans } from "../services/planService.js";

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });

  return successResponse(res, "Plans fetched successfully", { plans });
});

export const getPlanByCode = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({
    code: req.params.code,
    isActive: true,
  });

  if (!plan) {
    return errorResponse(res, "Plan not found", 404);
  }

  return successResponse(res, "Plan fetched successfully", { plan });
});

export const seedPlans = asyncHandler(async (req, res) => {
  const plans = await seedDefaultPlans({
    userId: req.user?._id || null,
  });

  return successResponse(res, "Default plans seeded successfully", { plans });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return errorResponse(res, "Plan not found", 404);
  }

  const allowedFields = [
    "name",
    "description",
    "price",
    "billingCycle",
    "features",
    "limits",
    "isActive",
    "isPopular",
    "sortOrder",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      plan[field] = req.body[field];
    }
  });

  plan.updatedBy = req.user._id;

  await plan.save();

  return successResponse(res, "Plan updated successfully", { plan });
});