import Batch from "../models/Batch.js";
import FeePlan from "../models/FeePlan.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const safeFields = [
  "name",
  "amount",
  "billingCycle",
  "martialArt",
  "batch",
  "isActive",
];

const buildPayload = (body) => {
  const payload = {};
  safeFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] || undefined;
    }
  });
  return payload;
};

const validateBatch = async ({ academyId, batchId }) => {
  if (!batchId) return true;
  const batch = await Batch.findOne({ _id: batchId, academy: academyId });
  return Boolean(batch);
};

export const createFeePlan = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  if (payload.batch) {
    const isValidBatch = await validateBatch({
      academyId: req.academyId,
      batchId: payload.batch,
    });

    if (!isValidBatch) {
      return errorResponse(res, "Batch not found in your academy", 404);
    }
  }

  const feePlan = await FeePlan.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Fee plan created successfully", { feePlan }, 201);
});

export const getFeePlans = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.academyId) filter.academy = req.academyId;

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const feePlans = await FeePlan.find(filter)
    .sort({ createdAt: -1 })
    .populate("batch", "batchName martialArt");

  return successResponse(res, "Fee plans fetched successfully", { feePlans });
});

export const getFeePlanById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePlan = await FeePlan.findOne(filter).populate(
    "batch",
    "batchName martialArt"
  );

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  return successResponse(res, "Fee plan fetched successfully", { feePlan });
});

export const updateFeePlan = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePlan = await FeePlan.findOne(filter);

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  const payload = buildPayload(req.body);

  if (payload.batch) {
    const isValidBatch = await validateBatch({
      academyId: feePlan.academy,
      batchId: payload.batch,
    });

    if (!isValidBatch) {
      return errorResponse(res, "Batch not found in your academy", 404);
    }
  }

  Object.assign(feePlan, payload, {
    updatedBy: req.user._id,
  });

  await feePlan.save();

  return successResponse(res, "Fee plan updated successfully", { feePlan });
});

export const deleteFeePlan = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePlan = await FeePlan.findOne(filter);

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  feePlan.isActive = false;
  feePlan.updatedBy = req.user._id;
  await feePlan.save();

  return successResponse(res, "Fee plan deactivated successfully", { feePlan });
});