import mongoose from "mongoose";

import Batch from "../models/Batch.js";
import Branch from "../models/Branch.js";
import Student from "../models/Student.js";

import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
} from "../utils/apiResponse.js";

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

export const createBatch = asyncHandler(async (req, res) => {
  if (req.body.branch) {
    await validateBranch(req.academyId, req.body.branch);
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
    ...req.body,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(
    res,
    "Batch created successfully",
    batch,
    201
  );
});

export const getBatches = asyncHandler(async (req, res) => {
  const { branch, martialArt } = req.query;

  const query = {
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  };

  if (branch) {
    query.branch = branch;
  }

  if (martialArt) {
    query.martialArt = martialArt;
  }

  const batches = await Batch.find(query)
    .populate("branch", "branchName branchCode")
    .populate("coach", "name email role")
    .populate("students", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    "Batches fetched successfully",
    batches
  );
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

  return successResponse(
    res,
    "Batch fetched successfully",
    batch
  );
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

  if (req.body.branch) {
    await validateBranch(req.academyId, req.body.branch);
  }

  Object.keys(req.body).forEach((key) => {
    batch[key] = req.body[key];
  });

  batch.updatedBy = req.user._id;

  await batch.save();

  return successResponse(
    res,
    "Batch updated successfully",
    batch
  );
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

  await batch.deleteOne();

  return successResponse(
    res,
    "Batch deleted successfully"
  );
});