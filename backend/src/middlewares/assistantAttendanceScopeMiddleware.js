import mongoose from "mongoose";

import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/apiResponse.js";
import { getAssistantCoachBranchIds } from "../services/branchAccessService.js";

const requestedBatchId = (req) =>
  req.params?.batchId ||
  req.query?.batch ||
  req.body?.batch ||
  null;

export const requireAssistantAttendanceScope = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== "assistant_coach") return next();

  const allowedBranches = new Set(getAssistantCoachBranchIds(req.user));
  if (!allowedBranches.size) {
    return errorResponse(res, "No active branch is assigned to this coach", 403);
  }

  if (req.params?.studentId) {
    if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) {
      return errorResponse(res, "Invalid student ID", 400);
    }
    const student = await Student.findOne({
      _id: req.params.studentId,
      academy: req.academyId,
    }).select("branch");
    if (!student) return errorResponse(res, "Student not found", 404);
    if (!student.branch || !allowedBranches.has(String(student.branch))) {
      return errorResponse(res, "This student is outside your assigned branches", 403);
    }
    return next();
  }

  const batchId = requestedBatchId(req);
  if (!batchId) {
    return errorResponse(res, "Assistant coaches must select an assigned batch", 403);
  }
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    return errorResponse(res, "Invalid batch ID", 400);
  }

  const batch = await Batch.findOne({ _id: batchId, academy: req.academyId }).select("branch");
  if (!batch) return errorResponse(res, "Batch not found", 404);
  if (!batch.branch || !allowedBranches.has(String(batch.branch))) {
    return errorResponse(res, "This batch is outside your assigned branches", 403);
  }

  return next();
});
