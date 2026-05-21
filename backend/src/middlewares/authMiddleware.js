import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { errorResponse } from "../utils/apiResponse.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return errorResponse(res, "Authentication token missing", 401);
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select("+password");

  if (!user) {
    return errorResponse(res, "User not found", 401);
  }

  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  req.user = user;
  next();
});