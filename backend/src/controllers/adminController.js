import User from "../models/User.js";
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