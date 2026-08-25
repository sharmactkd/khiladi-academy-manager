import mongoose from "mongoose";

import Student from "../models/Student.js";
import Branch from "../models/Branch.js";
import Batch from "../models/Batch.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import { buildBranchAccessFilter } from "../services/branchAccessService.js";
import { buildSafeSearchRegex } from "../utils/search.js";
import { hashSensitiveValue } from "../utils/fieldEncryption.js";
import { getPlanLimit, isLimitUnlimited } from "../services/planService.js";
import { getResourceUsage } from "../services/usageService.js";

const TAEKWONDO_BELTS = [
  "White",
  "Yellow",
  "Green",
  "Green One",
  "Blue",
  "Blue One",
  "Red",
  "Red One",
  "Black",
];

const DAN_RANKS = [
  "1st Dan",
  "2nd Dan",
  "3rd Dan",
  "4th Dan",
  "5th Dan",
  "6th Dan",
  "7th Dan",
  "8th Dan",
  "9th Dan",
  "10th Dan",
];

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

const cleanString = (value, maxLength = 500) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
};

const cleanPhone = (value) =>
  cleanString(value).replace(/\D/g, "").slice(0, 15);

const cleanAadhaar = (value) =>
  cleanString(value).replace(/\D/g, "").slice(0, 12);

const toNullableNumber = (value) => {
  if (value === "" || value === undefined || value === null) return null;

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
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

const normalizeStringArray = (value) => {
  const parsed = parseJsonIfNeeded(value, value);

  if (Array.isArray(parsed)) {
    return [...new Set(parsed.map((item) => cleanString(item, 120)).filter(Boolean))];
  }

  if (typeof parsed === "string") {
    return [...new Set(parsed.split(",").map((item) => cleanString(item, 120)).filter(Boolean))];
  }

  return [];
};

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

const normalizeBloodGroup = (value) => {
  const bloodGroup = cleanString(value).toUpperCase();
  const allowed = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return allowed.includes(bloodGroup) ? bloodGroup : "";
};

const normalizeBeltRank = ({ martialArt, beltRank }) => {
  const sport = cleanString(martialArt).toLowerCase();
  const belt = cleanString(beltRank, 80);

  if (sport === "taekwondo") {
    const matched = TAEKWONDO_BELTS.find(
      (item) => item.toLowerCase() === belt.toLowerCase()
    );

    return matched || "";
  }

  return belt;
};

const normalizeDanRank = ({ beltRank, danRank }) => {
  if (cleanString(beltRank).toLowerCase() !== "black") return "";

  const dan = cleanString(danRank, 40);
  const matched = DAN_RANKS.find(
    (item) => item.toLowerCase() === dan.toLowerCase()
  );

  return matched || "";
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
    const parsed = new Date(Number(year), Number(mm) - 1, Number(dd));

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
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

  if (payload.branch === "") payload.branch = null;
  if (payload.batch === "") payload.batch = null;

  payload.admissionNumber = cleanString(payload.admissionNumber, 80);
  payload.aadhaarNumber = cleanAadhaar(payload.aadhaarNumber);
  payload.firstName = cleanString(payload.firstName, 100);
  payload.lastName = cleanString(payload.lastName, 100);
  payload.gender = normalizeGender(payload.gender);
  if (Object.prototype.hasOwnProperty.call(body, "profileIncompleteFields")) {
    payload.profileIncompleteFields = normalizeStringArray(payload.profileIncompleteFields);
  } else delete payload.profileIncompleteFields;
  if (Object.prototype.hasOwnProperty.call(body, "legacySourceSheets")) {
    payload.legacySourceSheets = normalizeStringArray(payload.legacySourceSheets);
  } else delete payload.legacySourceSheets;
  if (Object.prototype.hasOwnProperty.call(body, "importSource")) {
    payload.importSource = ["manual", "excel-record", "excel-attendance"].includes(cleanString(payload.importSource))
      ? cleanString(payload.importSource)
      : "manual";
  } else delete payload.importSource;
  if (Object.prototype.hasOwnProperty.call(body, "profileStatus")) {
    payload.profileStatus = payload.profileStatus === "incomplete" ? "incomplete" : "complete";
  } else delete payload.profileStatus;
  payload.phone = cleanPhone(payload.phone);
  payload.email = cleanString(payload.email, 120).toLowerCase();

  payload.countryCode = cleanString(payload.countryCode || "+91", 10);
  payload.country = cleanString(payload.country || "India", 100);
  payload.state = cleanString(payload.state, 100);
  payload.city = cleanString(payload.city, 100);
  payload.address = cleanString(payload.address, 500);

  payload.parentName = cleanString(payload.parentName, 150);
  payload.parentCountryCode = cleanString(payload.parentCountryCode || "+91", 10);
  payload.parentPhone = cleanPhone(payload.parentPhone);

  const normalizeContacts = (value) => {
    let rows = value;
    if (typeof rows === "string") {
      try { rows = JSON.parse(rows); } catch { rows = []; }
    }
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 6).map((contact) => ({
      name: cleanString(contact?.name, 150),
      relation: cleanString(contact?.relation, 80),
      countryCode: cleanString(contact?.countryCode || "+91", 10),
      phone: cleanPhone(contact?.phone),
    })).filter((contact) => contact.name || contact.phone);
  };

  payload.parentContacts = normalizeContacts(payload.parentContacts);
  if (payload.parentContacts.length) {
    const primaryParent = payload.parentContacts[0];
    payload.parentName = primaryParent.name;
    payload.parentCountryCode = primaryParent.countryCode;
    payload.parentPhone = primaryParent.phone;
  } else if (payload.parentName || payload.parentPhone) {
    payload.parentContacts = [{
      name: payload.parentName,
      relation: cleanString(payload.parentRelation, 80),
      countryCode: payload.parentCountryCode,
      phone: payload.parentPhone,
    }];
  }

  payload.schoolName = cleanString(payload.schoolName, 200);
  payload.className = cleanString(payload.className, 80);
  payload.section = cleanString(payload.section, 40);
  payload.collegeName = cleanString(payload.collegeName, 200);
  payload.occupation = cleanString(payload.occupation, 150);

  payload.education = {
    schoolName: payload.schoolName,
    className: payload.className,
    section: payload.section,
    collegeName: payload.collegeName,
    occupation: payload.occupation,
  };

  payload.martialArt = cleanString(payload.martialArt || "Taekwondo", 80);
  payload.beltRank = normalizeBeltRank({
    martialArt: payload.martialArt,
    beltRank: payload.beltRank,
  });
  payload.danRank = normalizeDanRank({
    beltRank: payload.beltRank,
    danRank: payload.danRank,
  });

  payload.heightCm = toNullableNumber(payload.heightCm);
  payload.weightKg = toNullableNumber(payload.weightKg);
  payload.physicalInfo = {
    heightCm: payload.heightCm,
    weightKg: payload.weightKg,
  };

  payload.bloodGroup = normalizeBloodGroup(payload.bloodGroup);
  payload.medicalConditions = normalizeStringArray(payload.medicalConditions);
  payload.notes = cleanString(payload.notes || payload.medicalNotes, 1000);

  payload.medicalInfo = {
    bloodGroup: payload.bloodGroup,
    medicalConditions: payload.medicalConditions,
    notes: payload.notes,
  };

  if (
    payload.emergencyContactName !== undefined ||
    payload.emergencyContactPhone !== undefined ||
    payload.emergencyContactRelation !== undefined ||
    payload.emergencyContactCountryCode !== undefined
  ) {
    payload.emergencyContact = {
      name:
        cleanString(payload.emergencyContactName, 150) ||
        payload.emergencyContact?.name ||
        "",
      relation:
        cleanString(payload.emergencyContactRelation, 80) ||
        payload.emergencyContact?.relation ||
        "",
      countryCode:
        cleanString(payload.emergencyContactCountryCode || "+91", 10) ||
        payload.emergencyContact?.countryCode ||
        "+91",
      phone:
        cleanPhone(payload.emergencyContactPhone) ||
        payload.emergencyContact?.phone ||
        "",
    };
  }

  payload.emergencyContacts = normalizeContacts(payload.emergencyContacts);
  if (payload.emergencyContacts.length) {
    payload.emergencyContact = payload.emergencyContacts[0];
  } else if (payload.emergencyContact?.name || payload.emergencyContact?.phone) {
    payload.emergencyContacts = [payload.emergencyContact];
  }

  payload.status = normalizeStatus(payload.status);

  delete payload.studentCode;
  delete payload.name;
  delete payload.dob;
  delete payload.medicalNotes;
  delete payload.emergencyContactName;
  delete payload.emergencyContactPhone;
  delete payload.emergencyContactRelation;
  delete payload.emergencyContactCountryCode;
  delete payload.parentRelation;

  return payload;
};

const splitName = (row = {}) => {
  const firstName = cleanString(row.firstName, 100);
  const lastName = cleanString(row.lastName, 100);
  const fullName = cleanString(row.name, 200);

  if (firstName || lastName) return { firstName: firstName || "Unknown", lastName };

  if (fullName) {
    const parts = fullName.split(/\s+/);
    return {
      firstName: parts[0] || "Unknown",
      lastName: parts.slice(1).join(" "),
    };
  }

  return { firstName: "Unknown", lastName: "Student" };
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
    cleanString(row.admissionNumber, 40) || cleanString(row.studentCode, 40);

  if (preferred) return preferred;

  let counter = rowIndex + 1;

  while (counter < rowIndex + 10000) {
    const generated = `ADM-${Date.now()}-${String(counter).padStart(4, "0")}`;

    if (!usedAdmissionNumbers.has(generated.toLowerCase())) {
      const exists = await Student.exists({
        academy: academyId,
        admissionNumber: generated,
      });

      if (!exists) return generated;
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
  allowProvisional,
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

  const dateOfBirth = parseDateSafely(row.dateOfBirth, null);
  const joiningDate = parseDateSafely(row.joiningDate, new Date());
  const martialArt =
    cleanString(row.martialArt, 80) || matchedBatch?.martialArt || "Taekwondo";
  const beltRank = normalizeBeltRank({ martialArt, beltRank: row.beltRank });
  const incompleteFields = [...new Set([
    ...normalizeStringArray(row.profileIncompleteFields),
    ...(!dateOfBirth ? ["dateOfBirth"] : []),
    ...(!cleanString(row.gender) ? ["gender"] : []),
  ])];
  const profileStatus = incompleteFields.length ? "incomplete" : "complete";
  if (profileStatus === "incomplete" && !allowProvisional) {
    throw new Error(`Incomplete profile: ${incompleteFields.join(", ")} missing`);
  }

  return {
    academy: academyId,
    branch: matchedBatch?.branch || null,
    batch: matchedBatch?._id || null,
    admissionNumber,
    aadhaarNumber: cleanAadhaar(row.aadhaarNumber),
    firstName,
    lastName,
    gender: normalizeGender(row.gender),
    dateOfBirth,
    profileStatus,
    profileIncompleteFields: incompleteFields,
    importSource: row.importSource === "excel-attendance" ? "excel-attendance" : "excel-record",
    legacySourceSheets: normalizeStringArray(row.legacySourceSheets || row.sourceSheet),
    phone: cleanPhone(row.phone),
    email: cleanString(row.email, 120).toLowerCase(),
    schoolName: cleanString(row.schoolName, 200),
    className: cleanString(row.className, 80),
    section: cleanString(row.section, 40),
    collegeName: cleanString(row.collegeName, 200),
    occupation: cleanString(row.occupation, 150),
    parentName: cleanString(row.parentName, 150),
    parentPhone: cleanPhone(row.parentPhone),
    address: cleanString(row.address, 500),
    city: cleanString(row.city, 100),
    state: cleanString(row.state, 100),
    martialArt,
    beltRank,
    danRank: normalizeDanRank({ beltRank, danRank: row.danRank }),
    heightCm: toNullableNumber(row.heightCm),
    weightKg: toNullableNumber(row.weightKg),
    bloodGroup: normalizeBloodGroup(row.bloodGroup),
    medicalConditions: normalizeStringArray(row.medicalConditions),
    joiningDate,
    status: normalizeStatus(row.status),
    emergencyContact: {
      name: cleanString(row.emergencyContactName, 150),
      relation: "",
      countryCode: "+91",
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

  if (payload.branch) await validateBranch(academyId, payload.branch);

  if (!payload.admissionNumber) {
    payload.admissionNumber = await buildAdmissionNumber({
      academyId,
      row: payload,
      rowIndex: 0,
      usedAdmissionNumbers: new Set(),
    });
  }

  const hasDateOfBirth = Boolean(parseDateSafely(payload.dateOfBirth, null));
  payload.dateOfBirth = hasDateOfBirth ? payload.dateOfBirth : null;
  payload.profileIncompleteFields = hasDateOfBirth ? [] : ["dateOfBirth"];
  payload.profileStatus = hasDateOfBirth ? "complete" : "incomplete";

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

  return successResponse(res, "Student created successfully", student, 201);
});

export const importStudents = asyncHandler(async (req, res) => {
  const academyId = req.academyId;
  const userId = req.user._id;
  const students = Array.isArray(req.body?.students) ? req.body.students : [];
  const duplicateMode = req.body?.duplicateMode || "skip";
  const allowProvisional = req.body?.allowProvisional === true;

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

  let remainingCapacity = Number.POSITIVE_INFINITY;
  if (req.user?.role !== "super_admin") {
    const planLimit = await getPlanLimit({
      academyId,
      resourceName: "students",
    });
    if (!isLimitUnlimited(planLimit)) {
      const currentUsage = await getResourceUsage({
        academyId,
        resourceName: "students",
      });
      remainingCapacity = Math.max(0, Number(planLimit || 0) - currentUsage);
    }
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
        allowProvisional,
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

      const identityFilters = [{ admissionNumber: studentPayload.admissionNumber }];
      if (studentPayload.phone) {
        identityFilters.push({
          phone: studentPayload.phone,
          firstName: studentPayload.firstName,
          lastName: studentPayload.lastName,
        });
      }
      let existing = await Student.findOne({ academy: academyId, $or: identityFilters })
        .select("_id admissionNumber phone profileStatus profileIncompleteFields legacySourceSheets");

      if (!existing && !studentPayload.phone) {
        const sameName = await Student.find({
          academy: academyId,
          firstName: studentPayload.firstName,
          lastName: studentPayload.lastName,
        }).select("_id admissionNumber profileStatus profileIncompleteFields legacySourceSheets").limit(2);
        if (sameName.length === 1) existing = sameName[0];
      }

      if (existing && duplicateMode === "skip") {
        const mergedSheets = [...new Set([
          ...(existing.legacySourceSheets || []),
          ...(studentPayload.legacySourceSheets || []),
        ])];
        if (mergedSheets.length !== (existing.legacySourceSheets || []).length) {
          existing.legacySourceSheets = mergedSheets;
          existing.updatedBy = userId;
          await existing.save();
        }
        summary.skipped += 1;
        summary.warnings.push({
          rowNumber,
          admissionNumber: studentPayload.admissionNumber,
          message: "Duplicate admission number already exists, skipped",
        });
        continue;
      }

      if (!existing && remainingCapacity <= 0) {
        summary.failed += 1;
        summary.errors.push({
          rowNumber,
          admissionNumber: studentPayload.admissionNumber,
          message: "Student plan limit reached; row was not imported",
        });
        continue;
      }

      await Student.create(studentPayload);
      if (!existing && Number.isFinite(remainingCapacity)) {
        remainingCapacity -= 1;
      }
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
    ageCategory,
    bloodGroup,
    search,
  } = req.query;

  const query = {
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  };

  if (branch) query.branch = branch;
  if (batch) query.batch = batch;
  if (status) query.status = status;
  if (martialArt) query.martialArt = martialArt;
  if (ageCategory) query.ageCategory = ageCategory;
  if (bloodGroup) query.bloodGroup = bloodGroup;

  if (beltRank) {
    query.beltRank = buildSafeSearchRegex(beltRank, 40);
  }

  if (search) {
    const searchRegex = buildSafeSearchRegex(search, 100);
    const aadhaarDigits = String(search).replace(/\D/g, "");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { admissionNumber: searchRegex },
      ...(aadhaarDigits.length === 12
        ? [{ aadhaarHash: hashSensitiveValue(aadhaarDigits) }]
        : []),
      { phone: searchRegex },
    ];
  }

  const students = await Student.find(query)
    .select("-medicalConditions -medicalNotes")
    .populate("branch", "branchName branchCode currencyCode currencySymbol currencyCountryCode")
    .populate(
      "batch",
      "batchName martialArt isActive monthlyFee quarterlyFee annualFee"
    )
    .sort({ createdAt: -1 });

  return successResponse(res, "Students fetched successfully", students);
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  }).select("+aadhaarNumber")
    .populate("branch", "branchName branchCode currencyCode currencySymbol currencyCountryCode")
    .populate(
      "batch",
      "batchName martialArt isActive monthlyFee quarterlyFee annualFee"
    );

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  return successResponse(res, "Student fetched successfully", student);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  }).select("+aadhaarNumber");

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const payload = normalizeStudentPayload(req.body);

  if (payload.branch) await validateBranch(req.academyId, payload.branch);

  // Admission number is system-generated when omitted during creation. An
  // empty edit field must never erase that stable identity.
  if (!payload.admissionNumber) delete payload.admissionNumber;

  Object.keys(payload).forEach((key) => {
    student[key] = payload[key];
  });

  const hasDateOfBirth = Boolean(parseDateSafely(student.dateOfBirth, null));
  const remaining = new Set(student.profileIncompleteFields || []);
  if (hasDateOfBirth) remaining.delete("dateOfBirth");
  else remaining.add("dateOfBirth");
  student.profileIncompleteFields = [...remaining];
  student.profileStatus = remaining.size ? "incomplete" : "complete";

  if (req.file) {
    student.profilePhoto = getUploadedFilePath(req.file);
  }

  student.updatedBy = req.user._id;

  await student.save();

  return successResponse(res, "Student updated successfully", student);
});

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const nextStatus = cleanString(req.body?.status).toLowerCase();

  if (!["active", "inactive"].includes(nextStatus)) {
    return errorResponse(
      res,
      "Status must be either active or inactive",
      400
    );
  }

  const student = await Student.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  });

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  student.status = nextStatus;
  student.statusUpdatedAt = new Date();
  student.updatedBy = req.user._id;
  await student.save();

  return successResponse(res, "Student status updated successfully", {
    _id: student._id,
    status: student.status,
    statusUpdatedAt: student.statusUpdatedAt,
  });
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

  return successResponse(res, "Student deleted successfully");
});
