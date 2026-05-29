import mongoose from "mongoose";

import Student from "../models/Student.js";
import Branch from "../models/Branch.js";

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

export const createStudent = asyncHandler(async (req, res) => {
  const academyId = req.academyId;

  if (req.body.branch) {
    await validateBranch(academyId, req.body.branch);
  }

  const existing = await Student.findOne({
    academy: academyId,
    admissionNumber: req.body.admissionNumber,
  });

  if (existing) {
    return errorResponse(
      res,
      "Admission number already exists",
      409
    );
  }

  const student = await Student.create({
    ...req.body,
    academy: academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(
    res,
    "Student created successfully",
    student,
    201
  );
});

export const getStudents = asyncHandler(async (req, res) => {
  const {
    branch,
    batch,
    status,
    martialArt,
    beltRank,
    search,
  } = req.query;

  const query = {
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  };

  if (branch) {
    query.branch = branch;
  }

  if (batch) {
    query.batch = batch;
  }

  if (status) {
    query.status = status;
  }

  if (martialArt) {
    query.martialArt = martialArt;
  }

  if (beltRank) {
    query.beltRank = {
      $regex: beltRank,
      $options: "i",
    };
  }

  if (search) {
    query.$or = [
      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        admissionNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const students = await Student.find(query)
    .populate("branch", "branchName branchCode")
  .populate("batch", "batchName martialArt isActive monthlyFee quarterlyFee annualFee")
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    "Students fetched successfully",
    students
  );
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  })
    .populate("branch", "branchName branchCode")
    .populate("batch", "batchName martialArt isActive");

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  return successResponse(
    res,
    "Student fetched successfully",
    student
  );
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  if (req.body.branch) {
    await validateBranch(req.academyId, req.body.branch);
  }

  Object.keys(req.body).forEach((key) => {
    student[key] = req.body[key];
  });

  student.updatedBy = req.user._id;

  await student.save();

  return successResponse(
    res,
    "Student updated successfully",
    student
  );
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  await student.deleteOne();

  return successResponse(
    res,
    "Student deleted successfully"
  );
});