import FeePlan from "../models/FeePlan.js";
import Batch from "../models/Batch.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const validateBatch = async (academyId, batchId) => {
  if (!batchId) return null;

  const batch = await Batch.findOne({
    _id: batchId,
    academy: academyId,
  });

  if (!batch) {
    throw new Error("Batch not found in your academy");
  }

  return batch;
};

const buildFeePlanPayload = (body) => ({
  name: body.name,
  batch: body.batch || null,
  monthlyAmount: Number(body.monthlyAmount ?? body.amount ?? 0),
  amount: Number(body.monthlyAmount ?? body.amount ?? 0),
  billingCycle: body.billingCycle || "monthly",
  dueDay: Number(body.dueDay || 10),
  martialArt: body.martialArt || "",
  description: body.description || "",
  isDefault: Boolean(body.isDefault),
  isActive: body.isActive === undefined ? true : Boolean(body.isActive),
});

export const createFeePlan = asyncHandler(async (req, res) => {
  const payload = buildFeePlanPayload(req.body);

  if (!payload.name) {
    return errorResponse(res, "Fee plan name is required", 400);
  }

  if (payload.monthlyAmount < 0) {
    return errorResponse(res, "Monthly amount cannot be negative", 400);
  }

  if (payload.batch) {
    await validateBatch(req.academyId, payload.batch);
  }

  if (payload.isDefault) {
    await FeePlan.updateMany(
      {
        academy: req.academyId,
        isDefault: true,
      },
      {
        isDefault: false,
      }
    );
  }

  const feePlan = await FeePlan.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Fee plan created successfully", feePlan, 201);
});

export const getFeePlans = asyncHandler(async (req, res) => {
  const query = {
    academy: req.academyId,
  };

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === "true";
  }

  if (req.query.batch) {
    query.batch = req.query.batch;
  }

  const feePlans = await FeePlan.find(query)
    .populate("batch", "batchName martialArt isActive")
    .sort({ createdAt: -1 });

  return successResponse(res, "Fee plans fetched successfully", feePlans);
});

export const getFeePlanById = asyncHandler(async (req, res) => {
  const feePlan = await FeePlan.findOne({
    _id: req.params.id,
    academy: req.academyId,
  }).populate("batch", "batchName martialArt isActive");

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  return successResponse(res, "Fee plan fetched successfully", feePlan);
});

export const updateFeePlan = asyncHandler(async (req, res) => {
  const feePlan = await FeePlan.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  const payload = buildFeePlanPayload({
    ...feePlan.toObject(),
    ...req.body,
  });

  if (payload.batch) {
    await validateBatch(req.academyId, payload.batch);
  }

  if (payload.isDefault) {
    await FeePlan.updateMany(
      {
        academy: req.academyId,
        isDefault: true,
        _id: {
          $ne: feePlan._id,
        },
      },
      {
        isDefault: false,
      }
    );
  }

  Object.assign(feePlan, payload, {
    updatedBy: req.user._id,
  });

  await feePlan.save();

  return successResponse(res, "Fee plan updated successfully", feePlan);
});

export const deleteFeePlan = asyncHandler(async (req, res) => {
  const feePlan = await FeePlan.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!feePlan) {
    return errorResponse(res, "Fee plan not found", 404);
  }

  feePlan.isActive = false;
  feePlan.updatedBy = req.user._id;

  await feePlan.save();

  return successResponse(res, "Fee plan deactivated successfully", feePlan);
});