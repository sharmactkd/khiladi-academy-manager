import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import {
  calculateStudentPerformance,
  calculateAcademyPerformance,
  calculateBatchPerformance,
} from "../services/performanceAnalyticsService.js";

export const getStudentPerformance = asyncHandler(async (req, res) => {
  try {
    const data = await calculateStudentPerformance({
      academyId: req.academyId,
      studentId: req.params.studentId,
      user: req.user,
    });

    return successResponse(
      res,
      "Student performance fetched successfully",
      data
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    throw error;
  }
});

export const getAcademyPerformance = asyncHandler(async (req, res) => {
  const data = await calculateAcademyPerformance({
    academyId: req.academyId,
    query: req.query,
    user: req.user,
  });

  return successResponse(res, "Academy performance fetched successfully", data);
});

export const getBatchPerformance = asyncHandler(async (req, res) => {
  try {
    const data = await calculateBatchPerformance({
      academyId: req.academyId,
      batchId: req.params.batchId,
      user: req.user,
    });

    return successResponse(res, "Batch performance fetched successfully", data);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    throw error;
  }
});