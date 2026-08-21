import User from "../models/User.js";
import Academy from "../models/Academy.js";
import Subscription from "../models/Subscription.js";
import AdminGrant from "../models/AdminGrant.js";
import Payment from "../models/Payment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

const buildUserSearchQuery = ({ search, role }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    const regex = new RegExp(search.trim(), "i");

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
  if (req.query.search) { const regex = new RegExp(req.query.search.trim(), "i"); filter.$or = [{ academyName: regex }, { ownerName: regex }, { email: regex }, { city: regex }, { state: regex }]; }
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
