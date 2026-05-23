import BeltTest from "../models/BeltTest.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { createBeltTestTimeline } from "../services/timelineService.js";

const allowedFields = [
  "student",
  "currentBelt",
  "promotedToBelt",
  "testDate",
  "result",
  "examinerName",
  "remarks",
  "certificateNumber",
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

const applyPassResultToStudent = async ({ beltTest, userId }) => {
  if (beltTest.result !== "pass") return;

  await Student.findOneAndUpdate(
    {
      _id: beltTest.student,
      academy: beltTest.academy,
    },
    {
      $set: {
        beltRank: beltTest.promotedToBelt,
        updatedBy: userId,
      },
    },
    { new: true }
  );
};

export const createBeltTest = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: payload.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const beltTest = await BeltTest.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await applyPassResultToStudent({
    beltTest,
    userId: req.user._id,
  });

  await createBeltTestTimeline({
    beltTest,
    userId: req.user._id,
  });

  return successResponse(res, "Belt test created successfully", { beltTest }, 201);
});

export const getBeltTests = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
    isDeleted: false,
  };

  if (req.query.student) filter.student = req.query.student;
  if (req.query.result) filter.result = req.query.result;

  if (req.query.fromDate || req.query.toDate) {
    filter.testDate = {};

    if (req.query.fromDate) {
      filter.testDate.$gte = new Date(req.query.fromDate);
    }

    if (req.query.toDate) {
      filter.testDate.$lte = new Date(req.query.toDate);
    }
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");

    filter.$or = [
      { currentBelt: searchRegex },
      { promotedToBelt: searchRegex },
      { examinerName: searchRegex },
      { certificateNumber: searchRegex },
      { remarks: searchRegex },
    ];
  }

  const [beltTests, total] = await Promise.all([
    BeltTest.find(filter)
      .sort({ testDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("student", "name studentCode phone beltRank photo status")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email"),
    BeltTest.countDocuments(filter),
  ]);

  return successResponse(res, "Belt tests fetched successfully", {
    beltTests,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getBeltTestById = asyncHandler(async (req, res) => {
  const beltTest = await BeltTest.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  })
    .populate("student", "name studentCode phone beltRank photo status")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!beltTest) {
    return errorResponse(res, "Belt test not found", 404);
  }

  return successResponse(res, "Belt test fetched successfully", { beltTest });
});

export const getStudentBeltTests = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const beltTests = await BeltTest.find({
    academy: req.academyId,
    student: req.params.studentId,
    isDeleted: false,
  }).sort({ testDate: -1, createdAt: -1 });

  return successResponse(res, "Student belt history fetched successfully", {
    student,
    beltTests,
  });
});

export const updateBeltTest = asyncHandler(async (req, res) => {
  const beltTest = await BeltTest.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!beltTest) {
    return errorResponse(res, "Belt test not found", 404);
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

  Object.assign(beltTest, payload, {
    updatedBy: req.user._id,
  });

  await beltTest.save();

  await applyPassResultToStudent({
    beltTest,
    userId: req.user._id,
  });

  await createBeltTestTimeline({
    beltTest,
    userId: req.user._id,
  });

  return successResponse(res, "Belt test updated successfully", { beltTest });
});

export const deleteBeltTest = asyncHandler(async (req, res) => {
  const beltTest = await BeltTest.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!beltTest) {
    return errorResponse(res, "Belt test not found", 404);
  }

  beltTest.isDeleted = true;
  beltTest.deletedAt = new Date();
  beltTest.updatedBy = req.user._id;

  await beltTest.save();

  return successResponse(res, "Belt test deleted successfully", { beltTest });
});