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

const normalizeStringArray = (value, fallback = []) => {
  const parsed = parseJsonIfNeeded(value, []);
  const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  const normalized = [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
  return normalized.length ? normalized : fallback;
};

const normalizeAdditionalCoaches = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((coach) => ({
      name: String(coach?.name || "").trim(),
      countryCode: String(coach?.countryCode || "+91").trim(),
      phone: String(coach?.phone || "").trim(),
      achievements: String(coach?.achievements || "").trim(),
    }))
    .filter((coach) => coach.name || coach.phone || coach.achievements);
};

const normalizeSchedule = (value) => {
  const parsed = parseJsonIfNeeded(value, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      day: String(item?.day || "").trim().toLowerCase(),
      startTime: String(item?.startTime || "").trim(),
      endTime: String(item?.endTime || "").trim(),
      summerStartTime: String(item?.summerStartTime || item?.startTime || "").trim(),
      summerEndTime: String(item?.summerEndTime || item?.endTime || "").trim(),
      winterStartTime: String(item?.winterStartTime || "").trim(),
      winterEndTime: String(item?.winterEndTime || "").trim(),
    }))
    .filter((item) => item.day && item.startTime && item.endTime);
};

const normalizeBatchPayload = (body = {}) => {
  const martialArts = normalizeStringArray(body.martialArts, [String(body.martialArt || "Taekwondo").trim()]);
  const batchTypes = normalizeStringArray(body.batchTypes, [String(body.batchType || "regular").trim()]);
  const skillLevels = normalizeStringArray(body.skillLevels, [String(body.skillLevel || "beginner").trim()]);
  const modes = normalizeStringArray(body.modes, [String(body.mode || "offline").trim()]);
  const sessionSlots = normalizeStringArray(body.sessionSlots, [String(body.sessionSlot || "evening").trim()]);
  const legacyBatchTypes = ["regular", "competition", "poomsae", "sparring", "fitness", "kids", "adults", "black-belt", "custom"];
  const requestedBatchType = String(body.batchType || batchTypes[0] || "regular").trim();

  return ({
  branch: body.branch || null,

  batchName: String(body.batchName || "").trim(),
  batchCode: String(body.batchCode || "").trim().toUpperCase(),
  martialArt: martialArts[0],
  martialArts,
genderGroup: ["male", "female", "both"].includes(body.genderGroup)
  ? body.genderGroup
  : "both",
  
  batchType: legacyBatchTypes.includes(requestedBatchType) ? requestedBatchType : "custom",
  batchTypes,
  customBatchTypes: normalizeStringArray(body.customBatchTypes),
  skillLevel: skillLevels[0] || "beginner",
  skillLevels,
  mode: modes[0] || "offline",
  modes,
  sessionSlot: sessionSlots[0] || "evening",
  sessionSlots,
  venue: String(body.venue || "").trim(),
  batchColor: String(body.batchColor || "").trim(),

  coach: body.coach || null,
  headCoachName: String(body.headCoachName || "").trim(),
  headCoachCountryCode: String(body.headCoachCountryCode || "+91").trim(),
  headCoachPhone: String(body.headCoachPhone || "").trim(),
  headCoachAchievements: String(body.headCoachAchievements || "").trim(),
  assistantCoachName: String(body.assistantCoachName || "").trim(),
  assistantCoachCountryCode: String(body.assistantCoachCountryCode || "+91").trim(),
  assistantCoachPhone: String(body.assistantCoachPhone || "").trim(),
  assistantCoachAchievements: String(body.assistantCoachAchievements || "").trim(),
  additionalCoaches: normalizeAdditionalCoaches(body.additionalCoaches),

  schedule: normalizeSchedule(body.schedule),

  capacity: toNumber(body.capacity ?? body.maxStudents, 0),
  noCapacityLimit: normalizeBoolean(body.noCapacityLimit),

  minAge: toNullableNumber(body.minAge),
  maxAge: toNullableNumber(body.maxAge),
  minBelt: String(body.minBelt || "").trim(),
  maxBelt: String(body.maxBelt || "").trim(),
  noMinAgeLimit: normalizeBoolean(body.noMinAgeLimit),
  noMaxAgeLimit: normalizeBoolean(body.noMaxAgeLimit),
  noMinBeltLimit: normalizeBoolean(body.noMinBeltLimit),
  noMaxBeltLimit: normalizeBoolean(body.noMaxBeltLimit),

  monthlyFee: toNumber(body.monthlyFee, 0),
  quarterlyFee: toNumber(body.quarterlyFee, 0),
  annualFee: toNumber(body.annualFee, 0),
  registrationFee: toNumber(body.registrationFee, 0),
  uniformFee: toNumber(body.uniformFee, 0),
  examinationFee: toNumber(body.examinationFee, 0),
  lateFee: toNumber(body.lateFee, 0),
  noRegistrationFee: normalizeBoolean(body.noRegistrationFee),
  noLateFee: normalizeBoolean(body.noLateFee),

  minimumAttendancePercentage: toNumber(body.minimumAttendancePercentage, 75),

  batchLanguage: String(body.batchLanguage || "").trim(),
  batchLanguages: normalizeStringArray(body.batchLanguages),
  customBatchLanguages: normalizeStringArray(body.customBatchLanguages),
  whatsappGroupLink: String(body.whatsappGroupLink || "").trim(),
  googleMeetLink: String(body.googleMeetLink || "").trim(),

  isCompetitionBatch: normalizeBoolean(body.isCompetitionBatch, false),
  isActive: normalizeBoolean(body.isActive, true),

  notes: String(body.notes || "").trim(),
  });
};

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
    .populate("branch", "branchName branchCode currencyCode currencySymbol currencyCountryCode")
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
    .populate("branch", "branchName branchCode currencyCode currencySymbol currencyCountryCode")
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
