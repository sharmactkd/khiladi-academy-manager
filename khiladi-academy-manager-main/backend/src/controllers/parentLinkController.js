import StudentGuardian from "../models/StudentGuardian.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const allowedFields = [
  "relationship",
  "canViewAttendance",
  "canViewFees",
  "canViewProgress",
  "canViewDocuments",
  "isPrimary",
  "isActive",
];

const buildPayload = (body) => {
  const payload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });
  return payload;
};

const validateStudent = async ({ academyId, studentId }) => {
  return Student.findOne({ _id: studentId, academy: academyId });
};

const validateGuardianUser = async (guardianUserId) => {
  return User.findOne({
    _id: guardianUserId,
    role: { $in: ["parent", "student"] },
    isActive: true,
    isSuspended: false,
  });
};

export const createParentLink = asyncHandler(async (req, res) => {
  const student = await validateStudent({
    academyId: req.academyId,
    studentId: req.body.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const guardianUser = await validateGuardianUser(req.body.guardianUser);

  if (!guardianUser) {
    return errorResponse(res, "Guardian user must be active parent or student", 400);
  }

  if (req.body.isPrimary === true) {
    await StudentGuardian.updateMany(
      {
        academy: req.academyId,
        student: student._id,
      },
      { $set: { isPrimary: false } }
    );
  }

  const link = await StudentGuardian.findOneAndUpdate(
    {
      academy: req.academyId,
      student: student._id,
      guardianUser: guardianUser._id,
    },
    {
      $set: {
        ...buildPayload(req.body),
        isActive: req.body.isActive ?? true,
        linkedBy: req.user._id,
        updatedBy: req.user._id,
      },
      $setOnInsert: {
        academy: req.academyId,
        student: student._id,
        guardianUser: guardianUser._id,
        createdBy: req.user._id,
      },
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate("student", "name studentCode phone beltRank status")
    .populate("guardianUser", "name email phone role");

  return successResponse(res, "Parent/student link created successfully", { link }, 201);
});

export const getParentLinks = asyncHandler(async (req, res) => {
  const filter = { academy: req.academyId };

  if (req.query.student) filter.student = req.query.student;
  if (req.query.guardianUser) filter.guardianUser = req.query.guardianUser;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const links = await StudentGuardian.find(filter)
    .sort({ createdAt: -1 })
    .populate("student", "name studentCode phone beltRank status batch")
    .populate("guardianUser", "name email phone role")
    .populate("linkedBy", "name email");

  return successResponse(res, "Parent links fetched successfully", { links });
});

export const getMyLinkedStudents = asyncHandler(async (req, res) => {
  if (!["parent", "student"].includes(req.user.role)) {
    return errorResponse(res, "Only parent/student can access this route", 403);
  }

  const links = await StudentGuardian.find({
    guardianUser: req.user._id,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .populate("academy", "academyName city state")
    .populate("student", "name studentCode phone beltRank photo status batch");

  return successResponse(res, "Linked students fetched successfully", { links });
});

export const getStudentParentLinks = asyncHandler(async (req, res) => {
  const student = await validateStudent({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const links = await StudentGuardian.find({
    academy: req.academyId,
    student: req.params.studentId,
  })
    .sort({ isPrimary: -1, createdAt: -1 })
    .populate("guardianUser", "name email phone role");

  return successResponse(res, "Student parent links fetched successfully", {
    student,
    links,
  });
});

export const updateParentLink = asyncHandler(async (req, res) => {
  const link = await StudentGuardian.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!link) {
    return errorResponse(res, "Parent link not found", 404);
  }

  if (req.body.isPrimary === true) {
    await StudentGuardian.updateMany(
      {
        academy: req.academyId,
        student: link.student,
        _id: { $ne: link._id },
      },
      { $set: { isPrimary: false } }
    );
  }

  Object.assign(link, buildPayload(req.body), {
    updatedBy: req.user._id,
  });

  await link.save();

  return successResponse(res, "Parent link updated successfully", { link });
});

export const deleteParentLink = asyncHandler(async (req, res) => {
  const link = await StudentGuardian.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!link) {
    return errorResponse(res, "Parent link not found", 404);
  }

  link.isActive = false;
  link.updatedBy = req.user._id;

  await link.save();

  return successResponse(res, "Parent link deactivated successfully", { link });
});