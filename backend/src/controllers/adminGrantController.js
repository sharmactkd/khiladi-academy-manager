import AdminGrant from "../models/AdminGrant.js";
import Academy from "../models/Academy.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { activateSubscription, getPlanByCodeOrThrow } from "../services/billingService.js";

export const createAdminGrant = asyncHandler(async (req, res) => {
  const academy = await Academy.findById(req.body.academy);

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  const plan = await getPlanByCodeOrThrow(req.body.planCode);

  const grant = await AdminGrant.create({
    academy: academy._id,
    plan: plan._id,
    planCode: plan.code,
    grantType: req.body.grantType,
    startDate: req.body.startDate || new Date(),
    endDate: req.body.grantType === "lifetime" ? null : req.body.endDate || null,
    reason: req.body.reason || "",
    grantedBy: req.user._id,
    isActive: true,
  });

  const subscriptionStatus =
    req.body.grantType === "lifetime" ? "lifetime" : "admin_granted";

  const subscription = await activateSubscription({
    academy,
    plan,
    payment: null,
    source: "admin_grant",
    createdBy: req.user._id,
    freeMonths: 0,
    status: subscriptionStatus,
  });

  if (grant.endDate && subscription.status !== "lifetime") {
    subscription.endDate = grant.endDate;
    subscription.nextBillingDate = grant.endDate;
    await subscription.save();
  }

  return successResponse(res, "Admin grant created successfully", {
    grant,
    subscription,
  }, 201);
});

export const getAdminGrants = asyncHandler(async (req, res) => {
  const grants = await AdminGrant.find({})
    .sort({ createdAt: -1 })
    .populate("academy", "academyName city state subscriptionPlan subscriptionStatus")
    .populate("plan", "name code")
    .populate("grantedBy", "name email");

  return successResponse(res, "Admin grants fetched successfully", { grants });
});

export const revokeAdminGrant = asyncHandler(async (req, res) => {
  const grant = await AdminGrant.findById(req.params.id);

  if (!grant) {
    return errorResponse(res, "Admin grant not found", 404);
  }

  grant.isActive = false;
  await grant.save();

  const subscription = await Subscription.findOne({
    academy: grant.academy,
    source: "admin_grant",
    isCurrent: true,
  });

  if (subscription) {
    subscription.status = "cancelled";
    subscription.isCurrent = false;
    subscription.cancelledAt = new Date();
    subscription.updatedBy = req.user._id;
    await subscription.save();
  }

  const academy = await Academy.findById(grant.academy);

  if (academy) {
    academy.subscriptionStatus = "cancelled";
    academy.subscriptionPlan = "free";
    academy.maxStudentsAllowed = 50;
    academy.settings = {
      ...(academy.settings || {}),
      allowParentPortal: false,
    };
    await academy.save();
  }

  return successResponse(res, "Admin grant revoked successfully", {
    grant,
    subscription,
  });
});