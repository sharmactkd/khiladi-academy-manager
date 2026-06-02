import mongoose from "mongoose";

import Batch from "../models/Batch.js";
import Branch from "../models/Branch.js";
import Student from "../models/Student.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import { buildBranchAccessFilter } from "../services/branchAccessService.js";

const validateBranch = async (academyId, branchId) => {
  if (!branchId) return null;

  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new Error("Invalid branch id");
  }

  const branch = await Branch.findOne({
    _id: branchId,
    academy: academyId,
    isActive: true,
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  return branch;
};

const parseJsonIfNeeded = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return Boolean(value);
};

const toNumber = (value, fallback = 0) => {
  if (value === "" || value === undefined || value === null) return fallback;
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
};

const toNullableNumber = (value) => {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const normalizeAdditionalCoaches = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((coach) => ({
      name: String(coach?.name || "").trim(),
      phone: String(coach?.phone || "").trim(),
    }))
    .filter((coach) => coach.name || coach.phone);
};

const normalizeSchedule = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      day: String(item?.day || "").trim().toLowerCase(),
      startTime: String(item?.startTime || "").trim(),
      endTime: String(item?.endTime || "").trim(),
    }))
    .filter((item) => item.day && item.startTime && item.endTime);
};

const normalizeBatchPayload = (body = {}) => ({
  branch: body.branch || null,

  batchName: String(body.batchName || "").trim(),
  batchCode: String(body.batchCode || "").trim().toUpperCase(),
  martialArt: String(body.martialArt || "Taekwondo").trim(),
genderGroup: ["male", "female", "both"].includes(body.genderGroup)
  ? body.genderGroup
  : "both",
  
  batchType: body.batchType || "regular",
  skillLevel: body.skillLevel || "beginner",
  mode: body.mode || "offline",
  sessionSlot: body.sessionSlot || "",
  venue: String(body.venue || "").trim(),
  batchColor: String(body.batchColor || "").trim(),

  coach: body.coach || null,
  headCoachName: String(body.headCoachName || "").trim(),
  assistantCoachName: String(body.assistantCoachName || "").trim(),
  additionalCoaches: normalizeAdditionalCoaches(body.additionalCoaches),

  schedule: normalizeSchedule(body.schedule),

  capacity: toNumber(body.capacity ?? body.maxStudents, 0),

  minAge: toNullableNumber(body.minAge),
  maxAge: toNullableNumber(body.maxAge),
  minBelt: String(body.minBelt || "").trim(),
  maxBelt: String(body.maxBelt || "").trim(),

  monthlyFee: toNumber(body.monthlyFee, 0),
  quarterlyFee: toNumber(body.quarterlyFee, 0),
  annualFee: toNumber(body.annualFee, 0),
  registrationFee: toNumber(body.registrationFee, 0),
  uniformFee: toNumber(body.uniformFee, 0),
  examinationFee: toNumber(body.examinationFee, 0),
  lateFee: toNumber(body.lateFee, 0),

  minimumAttendancePercentage: toNumber(body.minimumAttendancePercentage, 75),

  batchLanguage: String(body.batchLanguage || "").trim(),
  whatsappGroupLink: String(body.whatsappGroupLink || "").trim(),
  googleMeetLink: String(body.googleMeetLink || "").trim(),

  isCompetitionBatch: normalizeBoolean(body.isCompetitionBatch, false),
  isActive: normalizeBoolean(body.isActive, true),

  notes: String(body.notes || "").trim(),
});

export const createBatch = asyncHandler(async (req, res) => {
  const payload = normalizeBatchPayload(req.body);

  if (payload.branch) {
    await validateBranch(req.academyId, payload.branch);
  }

  if (Array.isArray(req.body.students) && req.body.students.length) {
    const students = await Student.countDocuments({
      _id: { $in: req.body.students },
      academy: req.academyId,
    });

    if (students !== req.body.students.length) {
      return errorResponse(
        res,
        "Some students do not belong to this academy",
        400
      );
    }
  }

  const batch = await Batch.create({
    ...payload,
    students: Array.isArray(req.body.students) ? req.body.students : [],
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Batch created successfully", batch, 201);
});

export const getBatches = asyncHandler(async (req, res) => {
  const { branch, martialArt, batchType, skillLevel } = req.query;

  const query = {
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  };

  if (branch) query.branch = branch;
  if (martialArt) query.martialArt = martialArt;
  if (batchType) query.batchType = batchType;
  if (skillLevel) query.skillLevel = skillLevel;

  const batches = await Batch.find(query)
    .populate("branch", "branchName branchCode")
    .populate("coach", "name email role")
    .populate("students", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });

  return successResponse(res, "Batches fetched successfully", batches);
});

export const getBatchById = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  })
    .populate("branch", "branchName branchCode")
    .populate("coach", "name email role")
    .populate("students", "firstName lastName admissionNumber");

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  return successResponse(res, "Batch fetched successfully", batch);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  const payload = normalizeBatchPayload(req.body);

  if (payload.branch) {
    await validateBranch(req.academyId, payload.branch);
  }

  Object.assign(batch, payload);
  batch.updatedBy = req.user._id;

  await batch.save();

  return successResponse(res, "Batch updated successfully", batch);
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  batch.isActive = false;
  batch.updatedBy = req.user._id;

  await batch.save();

  return successResponse(res, "Batch marked inactive successfully", batch);
});

export const hardDeleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  await batch.deleteOne();

  return successResponse(res, "Batch permanently deleted successfully");
});