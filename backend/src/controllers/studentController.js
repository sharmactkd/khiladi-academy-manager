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

const getUploadedFilePath = (file) => {
  if (!file) return "";

  return `/${file.path.replace(/\\/g, "/")}`;
};

const normalizeStudentPayload = (body = {}) => {
  const payload = { ...body };

  if (payload.studentCode && !payload.admissionNumber) {
    payload.admissionNumber = payload.studentCode;
  }

  if (payload.name && !payload.firstName) {
    const nameParts = String(payload.name || "").trim().split(/\s+/);
    payload.firstName = nameParts[0] || "";
    payload.lastName = nameParts.slice(1).join(" ");
  }

  if (payload.dob && !payload.dateOfBirth) {
    payload.dateOfBirth = payload.dob;
  }

  if (payload.branch === "") {
    payload.branch = null;
  }

  if (payload.batch === "") {
    payload.batch = null;
  }

  if (
    payload.emergencyContactName !== undefined ||
    payload.emergencyContactPhone !== undefined ||
    payload.emergencyContactRelation !== undefined
  ) {
    payload.emergencyContact = {
      name:
        payload.emergencyContactName ||
        payload.emergencyContact?.name ||
        "",
      relation:
        payload.emergencyContactRelation ||
        payload.emergencyContact?.relation ||
        "",
      phone:
        payload.emergencyContactPhone ||
        payload.emergencyContact?.phone ||
        "",
    };
  }

  delete payload.studentCode;
  delete payload.name;
  delete payload.dob;
  delete payload.parentName;
  delete payload.parentPhone;
  delete payload.emergencyContactName;
  delete payload.emergencyContactPhone;
  delete payload.emergencyContactRelation;

  return payload;
};

export const createStudent = asyncHandler(async (req, res) => {
  const academyId = req.academyId;
  const payload = normalizeStudentPayload(req.body);

  if (payload.branch) {
    await validateBranch(academyId, payload.branch);
  }

  const existing = await Student.findOne({
    academy: academyId,
    admissionNumber: payload.admissionNumber,
  });

  if (existing) {
    return errorResponse(res, "Admission number already exists", 409);
  }

  const profilePhoto = getUploadedFilePath(req.file);

  const student = await Student.create({
    ...payload,
    academy: academyId,
    profilePhoto,
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
    .populate(
      "batch",
      "batchName martialArt isActive monthlyFee quarterlyFee annualFee"
    )
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
    .populate(
      "batch",
      "batchName martialArt isActive monthlyFee quarterlyFee annualFee"
    );

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

  const payload = normalizeStudentPayload(req.body);

  if (payload.branch) {
    await validateBranch(req.academyId, payload.branch);
  }

  Object.keys(payload).forEach((key) => {
    student[key] = payload[key];
  });

  if (req.file) {
    student.profilePhoto = getUploadedFilePath(req.file);
  }

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