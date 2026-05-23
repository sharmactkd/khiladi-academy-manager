import ChampionshipRecord from "../models/ChampionshipRecord.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { createChampionshipTimeline } from "../services/timelineService.js";

const allowedFields = [
  "student",
  "championshipName",
  "level",
  "eventType",
  "ageCategory",
  "weightCategory",
  "result",
  "date",
  "venue",
  "organizer",
  "remarks",
  "certificateUrl",
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

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

export const createChampionshipRecord = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: payload.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const championshipRecord = await ChampionshipRecord.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createChampionshipTimeline({
    championshipRecord,
    userId: req.user._id,
  });

  return successResponse(
    res,
    "Championship record created successfully",
    { championshipRecord },
    201
  );
});

export const getChampionshipRecords = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
    isDeleted: false,
  };

  if (req.query.student) filter.student = req.query.student;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.eventType) filter.eventType = req.query.eventType;
  if (req.query.result) filter.result = req.query.result;

  if (req.query.fromDate || req.query.toDate) {
    filter.date = {};

    if (req.query.fromDate) {
      filter.date.$gte = new Date(req.query.fromDate);
    }

    if (req.query.toDate) {
      filter.date.$lte = new Date(req.query.toDate);
    }
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");

    filter.$or = [
      { championshipName: searchRegex },
      { venue: searchRegex },
      { organizer: searchRegex },
      { ageCategory: searchRegex },
      { weightCategory: searchRegex },
      { remarks: searchRegex },
    ];
  }

  const [championshipRecords, total] = await Promise.all([
    ChampionshipRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("student", "name studentCode phone beltRank photo status")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email"),
    ChampionshipRecord.countDocuments(filter),
  ]);

  return successResponse(res, "Championship records fetched successfully", {
    championshipRecords,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getChampionshipRecordById = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  })
    .populate("student", "name studentCode phone beltRank photo status")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  return successResponse(res, "Championship record fetched successfully", {
    championshipRecord,
  });
});

export const getStudentChampionshipRecords = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const championshipRecords = await ChampionshipRecord.find({
    academy: req.academyId,
    student: req.params.studentId,
    isDeleted: false,
  }).sort({ date: -1, createdAt: -1 });

  return successResponse(
    res,
    "Student championship history fetched successfully",
    {
      student,
      championshipRecords,
    }
  );
});

export const updateChampionshipRecord = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  const payload = buildPayload(req.body);

  if (payload.student) {
    const student = await validateStudentAccess({
      academyId: req.academyId,
      studentId: payload.student,
    });

    if (!student) {
      return errorResponse(res, "Student not found in your academy", 404);
    }
  }

  Object.assign(championshipRecord, payload, {
    updatedBy: req.user._id,
  });

  await championshipRecord.save();

  await createChampionshipTimeline({
    championshipRecord,
    userId: req.user._id,
  });

  return successResponse(res, "Championship record updated successfully", {
    championshipRecord,
  });
});

export const deleteChampionshipRecord = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  championshipRecord.isDeleted = true;
  championshipRecord.deletedAt = new Date();
  championshipRecord.updatedBy = req.user._id;

  await championshipRecord.save();

  return successResponse(res, "Championship record deleted successfully", {
    championshipRecord,
  });
});