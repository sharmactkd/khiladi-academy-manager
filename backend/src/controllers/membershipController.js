import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  applyMembershipAdjustment,
  getStudentMembership,
  reverseMembershipAdjustment,
} from "../services/membershipService.js";

export const getMembership = asyncHandler(async (req, res) => {
  const data = await getStudentMembership({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });
  return successResponse(res, "Membership fetched successfully", data);
});

export const createMembershipAdjustment = asyncHandler(async (req, res) => {
  const data = await applyMembershipAdjustment({
    academyId: req.academyId,
    studentId: req.params.studentId,
    userId: req.user._id,
    payload: req.body,
  });
  return successResponse(res, "Membership adjusted successfully", data, 201);
});

export const reverseAdjustment = asyncHandler(async (req, res) => {
  const membership = await reverseMembershipAdjustment({
    academyId: req.academyId,
    adjustmentId: req.params.adjustmentId,
    userId: req.user._id,
    reason: req.body.reason,
  });
  return successResponse(res, "Adjustment reversed successfully", { membership });
});
