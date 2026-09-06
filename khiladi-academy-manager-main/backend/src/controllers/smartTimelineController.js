import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import {
  getSmartTimeline,
  generateAndSaveSmartTimeline,
} from "../services/smartTimelineService.js";

export const getStudentSmartTimeline = asyncHandler(async (req, res) => {
  try {
    const data = await getSmartTimeline({
      academyId: req.academyId,
      studentId: req.params.studentId,
      user: req.user,
    });

    return successResponse(
      res,
      "Smart timeline fetched successfully",
      data
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    throw error;
  }
});

export const generateStudentSmartTimeline = asyncHandler(async (req, res) => {
  try {
    const data = await generateAndSaveSmartTimeline({
      academyId: req.academyId,
      studentId: req.params.studentId,
      user: req.user,
    });

    return successResponse(
      res,
      "Smart timeline generated successfully",
      data
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    throw error;
  }
});