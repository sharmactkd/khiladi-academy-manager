import Academy from "../models/Academy.js";
import Branch from "../models/Branch.js";
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

  let academy;

  if (req.user.role === "assistant_coach") {
    const assignedBranches = await Branch.find({
      $or: [{ manager: req.user._id }, { coaches: req.user._id }],
      isActive: true,
    }).select("_id academy");

    const academyIds = [...new Set(assignedBranches.map((item) => String(item.academy)))];
    if (academyIds.length !== 1) {
      return errorResponse(
        res,
        academyIds.length ? "Coach assignments span multiple academies" : "No active branch is assigned to this coach",
        403
      );
    }

    academy = await Academy.findOne({ _id: academyIds[0], isActive: true });
    req.user.$locals.authorizedBranchIds = assignedBranches.map((item) => item._id);
  } else {
    academy = await Academy.findOne({ owner: req.user._id });
  }

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
