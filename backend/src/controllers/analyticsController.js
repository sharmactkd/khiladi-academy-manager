import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import {
  getDashboardAnalytics,
  getStudentAnalytics,
  getAttendanceAnalytics,
  getFeeAnalytics,
  getPerformanceAnalytics,
} from "../services/analyticsService.js";

export const dashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await getDashboardAnalytics({
    academyId: req.academyId,
    query: req.query,
    user: req.user,
  });

  return successResponse(res, "Dashboard analytics fetched successfully", data);
});

export const studentAnalytics = asyncHandler(async (req, res) => {
  const data = await getStudentAnalytics({
    academyId: req.academyId,
    query: req.query,
    user: req.user,
  });

  return successResponse(res, "Student analytics fetched successfully", data);
});

export const attendanceAnalytics = asyncHandler(async (req, res) => {
  const data = await getAttendanceAnalytics({
    academyId: req.academyId,
    query: req.query,
    user: req.user,
  });

  return successResponse(res, "Attendance analytics fetched successfully", data);
});

export const feeAnalytics = asyncHandler(async (req, res) => {
  try {
    const data = await getFeeAnalytics({
      academyId: req.academyId,
      query: req.query,
      user: req.user,
    });

    return successResponse(res, "Fee analytics fetched successfully", data);
  } catch (error) {
    if (error.statusCode === 403) {
      return errorResponse(res, error.message, 403);
    }

    throw error;
  }
});

export const performanceAnalytics = asyncHandler(async (req, res) => {
  const data = await getPerformanceAnalytics({
    academyId: req.academyId,
    query: req.query,
    user: req.user,
  });

  return successResponse(
    res,
    "Performance analytics fetched successfully",
    data
  );
});