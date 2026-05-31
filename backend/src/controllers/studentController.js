import mongoose from "mongoose";

import Student from "../models/Student.js";
import Branch from "../models/Branch.js";
import Batch from "../models/Batch.js";

import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
} from "../utils/apiResponse.js";

import { buildBranchAccessFilter } from "../services/branchAccessService.js";

const IMPORT_FALLBACK_DOB = new Date("2000-01-01T00:00:00.000Z");

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
  delete payload.emergencyContactName;
  delete payload.emergencyContactPhone;
  delete payload.emergencyContactRelation;

  return payload;
};

const cleanString = (value, maxLength = 500) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
};

const cleanPhone = (value) =>
  cleanString(value).replace(/\D/g, "").slice(0, 10);

const normalizeGender = (value) => {
  const gender = cleanString(value).toLowerCase();

  if (["m", "male", "boy", "boys"].includes(gender)) return "male";
  if (["f", "female", "girl", "girls"].includes(gender)) return "female";

  return "other";
};

const normalizeStatus = (value) => {
  const status = cleanString(value).toLowerCase();

  if (["inactive", "in active"].includes(status)) return "inactive";
  if (["left", "leave", "quit", "dropped"].includes(status)) return "left";

  return "active";
};

const parseDateSafely = (value, fallback = null) => {
  const raw = cleanString(value);

  if (!raw) return fallback;

  const directDate = new Date(raw);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (match) {
    const [, dd, mm, yyyy] = match;
    const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    const parsed = new Date(
      Number(year),
      Number(mm) - 1,
      Number(dd)
    );

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
};

const splitName = (row = {}) => {
  const firstName = cleanString(row.firstName, 100);
  const lastName = cleanString(row.lastName, 100);
  const fullName = cleanString(row.name, 200);

  if (firstName || lastName) {
    return {
      firstName: firstName || "Unknown",
      lastName,
    };
  }

  if (fullName) {
    const parts = fullName.split(/\s+/);

    return {
      firstName: parts[0] || "Unknown",
      lastName: parts.slice(1).join(" "),
    };
  }

  return {
    firstName: "Unknown",
    lastName: "Student",
  };
};

const buildBatchLookup = async (academyId) => {
  const batches = await Batch.find({
    academy: academyId,
    isActive: true,
  }).select("_id batchName branch martialArt");

  return batches.reduce((acc, batch) => {
    acc[cleanString(batch.batchName).toLowerCase()] = batch;
    return acc;
  }, {});
};

const buildAdmissionNumber = async ({
  academyId,
  row,
  rowIndex,
  usedAdmissionNumbers,
}) => {
  const preferred =
    cleanString(row.admissionNumber, 40) ||
    cleanString(row.studentCode, 40);

  if (preferred) {
    return preferred;
  }

  let counter = rowIndex + 1;

  while (counter < rowIndex + 10000) {
    const generated = `ADM-${Date.now()}-${String(counter).padStart(4, "0")}`;

    if (!usedAdmissionNumbers.has(generated.toLowerCase())) {
      const exists = await Student.exists({
        academy: academyId,
        admissionNumber: generated,
      });

      if (!exists) {
        return generated;
      }
    }

    counter += 1;
  }

  return `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeImportRow = async ({
  row,
  rowIndex,
  academyId,
  userId,
  batchLookup,
  usedAdmissionNumbers,
}) => {
  const { firstName, lastName } = splitName(row);
  const batchName = cleanString(row.batchName);
  const matchedBatch = batchName
    ? batchLookup[batchName.toLowerCase()] || null
    : null;

  const admissionNumber = await buildAdmissionNumber({
    academyId,
    row,
    rowIndex,
    usedAdmissionNumbers,
  });

  const dateOfBirth = parseDateSafely(row.dateOfBirth, IMPORT_FALLBACK_DOB);
  const joiningDate = parseDateSafely(row.joiningDate, new Date());

  return {
    academy: academyId,
    branch: matchedBatch?.branch || null,
    batch: matchedBatch?._id || null,
    admissionNumber,
    firstName,
    lastName,
    gender: normalizeGender(row.gender),
    dateOfBirth,
    phone: cleanPhone(row.phone),
    email: cleanString(row.email, 120).toLowerCase(),
    schoolName: cleanString(row.schoolName, 200),
    parentName: cleanString(row.parentName, 150),
    parentPhone: cleanPhone(row.parentPhone),
    address: cleanString(row.address, 500),
    city: cleanString(row.city, 100),
    state: cleanString(row.state, 100),
    martialArt:
      cleanString(row.martialArt, 80) ||
      matchedBatch?.martialArt ||
      "Taekwondo",
    beltRank: cleanString(row.beltRank, 80),
    joiningDate,
    status: normalizeStatus(row.status),
    emergencyContact: {
      name: cleanString(row.emergencyContactName, 150),
      relation: "",
      phone: cleanPhone(row.emergencyContactPhone),
    },
    notes: cleanString(row.notes, 1000),
    createdBy: userId,
    updatedBy: userId,
  };
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

export const importStudents = asyncHandler(async (req, res) => {
  const academyId = req.academyId;
  const userId = req.user._id;
  const students = Array.isArray(req.body?.students)
    ? req.body.students
    : [];

  const duplicateMode = req.body?.duplicateMode || "skip";

  const summary = {
    totalRows: students.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
    errors: [],
  };

  if (!students.length) {
    return successResponse(res, "Student import completed", summary);
  }

  const batchLookup = await buildBatchLookup(academyId);
  const usedAdmissionNumbers = new Set();

  for (let index = 0; index < students.length; index += 1) {
    const row = students[index] || {};
    const rowNumber = row.rowNumber || index + 2;

    try {
      const studentPayload = await normalizeImportRow({
        row,
        rowIndex: index,
        academyId,
        userId,
        batchLookup,
        usedAdmissionNumbers,
      });

      const admissionKey = studentPayload.admissionNumber.toLowerCase();

      if (usedAdmissionNumbers.has(admissionKey)) {
        summary.skipped += 1;
        summary.warnings.push({
          rowNumber,
          admissionNumber: studentPayload.admissionNumber,
          message: "Duplicate admission number inside uploaded file skipped",
        });
        continue;
      }

      usedAdmissionNumbers.add(admissionKey);

      const existing = await Student.findOne({
        academy: academyId,
        admissionNumber: studentPayload.admissionNumber,
      }).select("_id admissionNumber");

      if (existing && duplicateMode === "skip") {
        summary.skipped += 1;
        summary.warnings.push({
          rowNumber,
          admissionNumber: studentPayload.admissionNumber,
          message: "Duplicate admission number already exists, skipped",
        });
        continue;
      }

      await Student.create(studentPayload);
      summary.imported += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        rowNumber,
        message: error.message || "Row import failed",
      });
    }
  }

  return successResponse(res, "Student import completed", summary);
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