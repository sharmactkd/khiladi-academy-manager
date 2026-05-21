import mongoose from "mongoose";
import Academy from "../models/Academy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/apiResponse.js";

export const attachMyAcademy = (options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { strict = false } = options;

    if (!req.user?._id) {
      return errorResponse(res, "Authentication required", 401);
    }

    const academy = await Academy.findOne({ owner: req.user._id });

    req.academy = academy || null;

    if (strict && !req.academy) {
      return errorResponse(res, "Academy not found", 404);
    }

    next();
  });

export const requireAcademy = (req, res, next) => {
  if (!req.academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  next();
};

export const requireAcademyOwner = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Authentication required", 401);
  }

  if (!["academy_owner", "super_admin"].includes(req.user.role)) {
    return errorResponse(res, "Only academy owner can perform this action", 403);
  }

  if (req.user.role === "super_admin") {
    return next();
  }

  const academyId =
    req.params.academyId || req.params.id || req.academy?._id?.toString();

  if (!academyId) {
    return next();
  }

  if (!mongoose.Types.ObjectId.isValid(academyId)) {
    return errorResponse(res, "Invalid academy ID", 400);
  }

  const academy = req.academy || (await Academy.findById(academyId));

  if (!academy) {
    return errorResponse(res, "Academy not found", 404);
  }

  if (academy.owner.toString() !== req.user._id.toString()) {
    return errorResponse(res, "You are not authorized for this academy", 403);
  }

  req.academy = academy;
  next();
});