import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const safeBatchFields = [
  "branch",
  "batchName",
  "martialArt",
  "coach",
  "assistantCoaches",
  "days",
  "startTime",
  "endTime",
  "maxStudents",
  "status",
  "notes",
];

const buildPayload = (body) => {
  const payload = {};
  safeBatchFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] || undefined;
    }
  });
  return payload;
};

export const createBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.create({
    ...buildPayload(req.body),
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Batch created successfully", { batch }, 201);
});

export const getBatches = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.academyId) filter.academy = req.academyId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.martialArt) filter.martialArt = req.query.martialArt;

  const batches = await Batch.find(filter)
    .sort({ createdAt: -1 })
    .populate("coach", "name email phone role")
    .populate("assistantCoaches", "name email phone role")
    .lean();

  const batchIds = batches.map((batch) => batch._id);

  const counts = await Student.aggregate([
    {
      $match: {
        batch: { $in: batchIds },
        status: { $ne: "left" },
      },
    },
    {
      $group: {
        _id: "$batch",
        studentCount: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(
    counts.map((item) => [String(item._id), item.studentCount])
  );

  const result = batches.map((batch) => ({
    ...batch,
    studentCount: countMap.get(String(batch._id)) || 0,
  }));

  return successResponse(res, "Batches fetched successfully", {
    batches: result,
  });
});

export const getBatchById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const batch = await Batch.findOne(filter)
    .populate("coach", "name email phone role")
    .populate("assistantCoaches", "name email phone role");

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  const studentCount = await Student.countDocuments({
    academy: batch.academy,
    batch: batch._id,
    status: { $ne: "left" },
  });

  return successResponse(res, "Batch fetched successfully", {
    batch,
    studentCount,
  });
});

export const updateBatch = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const batch = await Batch.findOne(filter);

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  Object.assign(batch, buildPayload(req.body), {
    updatedBy: req.user._id,
  });

  await batch.save();

  return successResponse(res, "Batch updated successfully", { batch });
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const batch = await Batch.findOne(filter);

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  batch.status = "inactive";
  batch.updatedBy = req.user._id;
  await batch.save();

  return successResponse(res, "Batch deactivated successfully", { batch });
});