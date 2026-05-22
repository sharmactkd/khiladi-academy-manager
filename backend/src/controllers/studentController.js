import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const safeStudentFields = [
  "branch",
  "batch",
  "studentCode",
  "admissionNumber",
  "name",
  "photo",
  "gender",
  "dob",
  "phone",
  "email",
  "parentName",
  "parentPhone",
  "address",
  "city",
  "state",
  "martialArt",
  "beltRank",
  "joiningDate",
  "status",
  "medicalNotes",
  "emergencyContactName",
  "emergencyContactPhone",
];

const buildPayload = (body) => {
  const payload = {};
  safeStudentFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] || undefined;
    }
  });
  return payload;
};

const validateBatchAccess = async ({ academyId, batchId }) => {
  if (!batchId) return null;

  const batch = await Batch.findOne({
    _id: batchId,
    academy: academyId,
  });

  return batch;
};

export const createStudent = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  if (payload.batch) {
    const batch = await validateBatchAccess({
      academyId: req.academyId,
      batchId: payload.batch,
    });

    if (!batch) {
      return errorResponse(res, "Batch not found in your academy", 404);
    }
  }

  const student = await Student.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Student created successfully", { student }, 201);
});

export const getStudents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.academyId) filter.academy = req.academyId;

  if (req.query.status) filter.status = req.query.status;
  if (req.query.batch) filter.batch = req.query.batch;
  if (req.query.martialArt) filter.martialArt = req.query.martialArt;
  if (req.query.beltRank) filter.beltRank = req.query.beltRank;

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { studentCode: searchRegex },
    ];
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("batch", "batchName martialArt days startTime endTime status"),
    Student.countDocuments(filter),
  ]);

  return successResponse(res, "Students fetched successfully", {
    students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getStudentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const student = await Student.findOne(filter).populate(
    "batch",
    "batchName martialArt days startTime endTime status"
  );

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  return successResponse(res, "Student fetched successfully", { student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const student = await Student.findOne(filter);

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const payload = buildPayload(req.body);

  if (payload.batch) {
    const batch = await validateBatchAccess({
      academyId: student.academy,
      batchId: payload.batch,
    });

    if (!batch) {
      return errorResponse(res, "Batch not found in your academy", 404);
    }
  }

  Object.assign(student, payload, {
    updatedBy: req.user._id,
  });

  await student.save();

  return successResponse(res, "Student updated successfully", { student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const student = await Student.findOne(filter);

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  student.status = "left";
  student.updatedBy = req.user._id;
  await student.save();

  return successResponse(res, "Student marked as left successfully", {
    student,
  });
});