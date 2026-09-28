import AddOnDefinition from "../models/AddOnDefinition.js";
import Academy from "../models/Academy.js";
import Entitlement from "../models/Entitlement.js";
import Plan from "../models/Plan.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { activateEntitlement, seedDefaultAddOns } from "../services/entitlementService.js";

export const getAdminEntitlements = asyncHandler(async (_req, res) => {
  const entitlements = await Entitlement.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .populate("owner", "name email phone")
    .populate("academy", "academyName ownerName")
    .populate("addOn", "name code price billingCycle");
  return successResponse(res, "Entitlements fetched", { entitlements });
});

export const getAdminAddOns = asyncHandler(async (req, res) => {
  let addOns = await AddOnDefinition.find().sort({ sortOrder: 1 });
  if (!addOns.length) addOns = await seedDefaultAddOns({ userId: req.user._id });
  return successResponse(res, "Add-on catalogue fetched", { addOns });
});

export const getAdminPlans = asyncHandler(async (_req, res) => {
  const plans = await Plan.find().sort({ sortOrder: 1 });
  return successResponse(res, "Plan catalogue fetched", { plans });
});

export const grantAdminEntitlement = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 8) return errorResponse(res, "A clear admin reason of at least 8 characters is required", 400);
  const academy = await Academy.findById(req.body.academyId);
  if (!academy) return errorResponse(res, "Academy not found", 404);
  const addOn = await AddOnDefinition.findOne({ code: req.body.addOnCode, isActive: true });
  if (!addOn) return errorResponse(res, "Active add-on not found", 404);
  const quantity = addOn.stackable ? Math.max(1, Math.min(100, Number(req.body.quantity || 1))) : 1;
  const entitlement = await activateEntitlement({
    ownerId: academy.owner,
    academyId: academy._id,
    addOn,
    quantity,
    source: "admin_grant",
    actorId: req.user._id,
  });
  entitlement.cancellationReason = `ADMIN GRANT REASON: ${reason}`;
  await entitlement.save();
  return successResponse(res, "Admin entitlement granted", { entitlement }, 201);
});

export const revokeAdminEntitlement = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 8) return errorResponse(res, "A clear revocation reason of at least 8 characters is required", 400);
  const entitlement = await Entitlement.findById(req.params.id);
  if (!entitlement) return errorResponse(res, "Entitlement not found", 404);
  entitlement.status = "cancelled";
  entitlement.autoRenew = false;
  entitlement.endDate = new Date();
  entitlement.graceEndsAt = new Date();
  entitlement.cancellationReason = `ADMIN REVOKE REASON: ${reason}`;
  entitlement.updatedBy = req.user._id;
  await entitlement.save();
  return successResponse(res, "Entitlement revoked", { entitlement });
});

export const updateAdminAddOn = asyncHandler(async (req, res) => {
  const addOn = await AddOnDefinition.findById(req.params.id);
  if (!addOn) return errorResponse(res, "Add-on not found", 404);
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 8) return errorResponse(res, "A pricing change reason of at least 8 characters is required", 400);
  if (req.body.price !== undefined) {
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price < 0) return errorResponse(res, "Invalid price", 400);
    if (price !== addOn.price) addOn.version += 1;
    addOn.price = price;
  }
  if (req.body.isActive !== undefined) addOn.isActive = Boolean(req.body.isActive);
  addOn.updatedBy = req.user._id;
  await addOn.save();
  return successResponse(res, "Add-on catalogue updated; existing entitlements retain their price version", { addOn, reason });
});
