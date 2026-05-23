import Student from "../models/Student.js";
import StudentTimeline from "../models/StudentTimeline.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { createManualTimelineNote } from "../services/timelineService.js";

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

export const getStudentTimeline = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const limit = Math.min(Number(req.query.limit) || 100, 200);

  const filter = {
    academy: req.academyId,
    student: req.params.studentId,
  };

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const timeline = await StudentTimeline.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  return successResponse(res, "Student timeline fetched successfully", {
    student,
    timeline,
  });
});

export const createStudentTimeline = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.body.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const timeline = await createManualTimelineNote({
    academy: req.academyId,
    student: req.body.student,
    title: req.body.title,
    description: req.body.description || "",
    date: req.body.date,
    userId: req.user._id,
  });

  return successResponse(res, "Timeline note created successfully", {
    timeline,
  }, 201);
});