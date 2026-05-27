import Academy from "../models/Academy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/apiResponse.js";

const getRequestedAcademyId = (req) => {
  return (
    req.headers?.["x-academy-id"] ||
    req.query?.academyId ||
    req.body?.academyId ||
    null
  );
};

export const resolveUserAcademy = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Authentication required", 401);
  }

  if (req.user.role === "super_admin") {
    const academyId = getRequestedAcademyId(req);

    if (academyId) {
      const academy = await Academy.findById(academyId);

      if (!academy) {
        return errorResponse(res, "Academy not found", 404);
      }

      req.academy = academy;
      req.academyId = academy._id;
      return next();
    }

    const academy = await Academy.findOne({ owner: req.user._id });

    if (academy) {
      req.academy = academy;
      req.academyId = academy._id;
      return next();
    }

    req.academy = null;
    req.academyId = null;
    return next();
  }

  const academy = await Academy.findOne({ owner: req.user._id });

  if (!academy) {
    return errorResponse(
      res,
      "Academy profile not found. Please create your academy first.",
      404
    );
  }

  req.academy = academy;
  req.academyId = academy._id;
  return next();
});

export const requireResolvedAcademy = (req, res, next) => {
  if (!req.academyId) {
    return errorResponse(res, "Academy is required for this action", 400);
  }

  next();
};