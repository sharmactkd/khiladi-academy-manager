import User from "../models/User.js";
import Academy from "../models/Academy.js";
import Subscription from "../models/Subscription.js";
import AdminGrant from "../models/AdminGrant.js";
import Payment from "../models/Payment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { buildSafeSearchRegex } from "../utils/search.js";

const buildUserSearchQuery = ({ search, role }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    const regex = buildSafeSearchRegex(search);

    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { role: regex },
    ];
  }

  return query;
};

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const query = buildUserSearchQuery({
    search: req.query.search,
    role: req.query.role,
  });

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return successResponse(res, "Users fetched successfully", {
    users: users.map((user) => user.createSafeResponse()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const [users, academies, activeAcademies, subscriptions, activeSubscriptions, trials, activeGrants, revenue, recentAcademies] = await Promise.all([
    User.countDocuments(), Academy.countDocuments(), Academy.countDocuments({ isActive: true }), Subscription.countDocuments(), Subscription.countDocuments({ isCurrent: true, status: { $in: ["active", "lifetime", "admin_granted"] } }), Subscription.countDocuments({ isCurrent: true, status: "trial" }), AdminGrant.countDocuments({ isActive: true }), Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]), Academy.find().sort({ createdAt: -1 }).limit(6).populate("owner", "name email phone"),
  ]);
  return successResponse(res, "Admin overview fetched successfully", { summary: { users, academies, activeAcademies, subscriptions, activeSubscriptions, trials, activeGrants, revenue: revenue[0]?.total || 0 }, recentAcademies });
});

export const getAcademies = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1); const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100); const filter = {};
  if (req.query.status) filter.subscriptionStatus = req.query.status;
  if (req.query.plan) filter.subscriptionPlan = req.query.plan;
  if (req.query.search) { const regex = buildSafeSearchRegex(req.query.search); filter.$or = [{ academyName: regex }, { ownerName: regex }, { email: regex }, { city: regex }, { state: regex }]; }
  const [academies, total] = await Promise.all([Academy.find(filter).populate("owner", "name email phone role isActive isSuspended").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Academy.countDocuments(filter)]);
  return successResponse(res, "Academies fetched successfully", { academies, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1); const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100); const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.planCode) filter.planCode = req.query.planCode;
  if (req.query.current !== undefined) filter.isCurrent = req.query.current === "true";
  const [subscriptions, total] = await Promise.all([Subscription.find(filter).populate("academy", "academyName ownerName city state email").populate("plan", "name code price billingCycle").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Subscription.countDocuments(filter)]);
  return successResponse(res, "Subscriptions fetched successfully", { subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const updateUserPlatformStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id) && (req.body.isSuspended === true || req.body.isActive === false)) {
    return errorResponse(res, "You cannot suspend or deactivate your own Superadmin account", 409);
  }
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, "User not found", 404);
  if (user.role === "super_admin" && user._id.toString() !== req.user._id.toString()) {
    return errorResponse(res, "A separate protected Superadmin approval workflow is required", 403);
  }
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  if (req.body.isSuspended !== undefined) {
    user.isSuspended = Boolean(req.body.isSuspended);
    user.suspendedAt = user.isSuspended ? new Date() : null;
    user.suspensionReason = user.isSuspended ? String(req.body.reason || "Superadmin action").slice(0, 500) : "";
    if (user.isSuspended) {
      user.refreshTokens = [];
      user.authInvalidBefore = new Date();
    }
  }
  await user.save();
  return successResponse(res, "User platform status updated", { user: user.createSafeResponse() });
});

export const updateAcademyPlatformStatus = asyncHandler(async (req, res) => {
  const academy = await Academy.findById(req.params.id);
  if (!academy) return errorResponse(res, "Academy not found", 404);
  if (req.body.isActive !== undefined) academy.isActive = Boolean(req.body.isActive);
  await academy.save();
  return successResponse(res, "Academy platform status updated", { academy });
});
