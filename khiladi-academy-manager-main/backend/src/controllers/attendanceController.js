import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import AttendanceDayNote from "../models/AttendanceDayNote.js";
import AttendanceImportMapping from "../models/AttendanceImportMapping.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  getMonthlyAttendanceRegister,
  getStudentYearlyAttendanceProfile,
  getYearlyAttendanceRegister,
  saveMonthlyAttendanceRegister,
  moveMonthlyAttendanceRow,
} from "../services/monthlyAttendanceService.js";

const startOfDay = (value) => {
  const raw = clean(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const buildDateFilter = (query) => {
  const filter = {};

  if (query.from || query.to) {
    filter.$gte = query.from ? startOfDay(query.from) : new Date("1970-01-01");

    if (query.to) {
      const to = startOfDay(query.to);
      to.setUTCHours(23, 59, 59, 999);
      filter.$lte = to;
    }
  }

  return Object.keys(filter).length ? filter : null;
};

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizePhone = (value) => clean(value).replace(/\D/g, "").slice(-10);

const normalizeName = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(mammi|mummy|papa|father|mother|guardian)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DAY_NOTE_TYPES = new Set([
  "sick-leave",
  "rainy-day",
  "championship",
  "festival",
  "other",
]);

const parseDateKey = (value) => {
  const raw = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStudentName = (student) =>
  clean(`${student.firstName || ""} ${student.lastName || ""}`);

const buildStudentLookups = async (academyId) => {
  const students = await Student.find({
    academy: academyId,
  }).select("_id firstName lastName admissionNumber phone batch status");

  const normalizedStudents = [];
  const byId = new Map();
  const phoneCandidates = new Map();
  const admissionCandidates = new Map();
  const nameCandidates = new Map();
  const nameBatchCandidates = new Map();

  const addCandidate = (map, key, student) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(student);
  };

  students.forEach((student) => {
    const phone = normalizePhone(student.phone);
    const admission = clean(student.admissionNumber).toLowerCase();
    const name = normalizeName(getStudentName(student));
    const batchKey = student.batch ? String(student.batch) : "";
    byId.set(String(student._id), student);
    addCandidate(phoneCandidates, phone, student);
    addCandidate(admissionCandidates, admission, student);
    addCandidate(nameCandidates, name, student);
    addCandidate(nameBatchCandidates, `${name}::${batchKey}`, student);

    normalizedStudents.push({
      student,
      phone,
      admission,
      name,
      batchKey,
    });
  });

  return {
    normalizedStudents,
    byId,
    phoneCandidates,
    admissionCandidates,
    nameCandidates,
    nameBatchCandidates,
  };
};

const buildBatchNameLookup = async (academyId) => {
  const batches = await Batch.find({
    academy: academyId,
  }).select("_id batchName isActive");

  return batches.reduce((acc, batch) => {
    acc.set(clean(batch.batchName).toLowerCase(), batch);
    return acc;
  }, new Map());
};

export const getAttendanceImportRowKey = (row, rowIndex = 0) =>
  [
    clean(row.sourceSheet).toLowerCase() || "sheet",
    Number(row.importedRowNumber || row.rowNumber || rowIndex + 2),
    normalizePhone(row.phone),
    normalizeName(row.name),
  ].join("::");

const getSavedAttendanceMappings = async ({ academyId, batchId, rows }) => {
  const sourceKeys = rows.map((row, rowIndex) =>
    getAttendanceImportRowKey(row, rowIndex)
  );
  const mappings = await AttendanceImportMapping.find({
    academy: academyId,
    batch: batchId,
    sourceKey: { $in: sourceKeys },
  }).select("sourceKey student").lean();

  return mappings.reduce((result, mapping) => {
    result[mapping.sourceKey] = String(mapping.student);
    return result;
  }, {});
};

const serializeStudentCandidate = (student) => ({
  _id: String(student._id),
  name: getStudentName(student),
  phone: normalizePhone(student.phone),
  admissionNumber: clean(student.admissionNumber),
  batch: student.batch ? String(student.batch) : "",
  status: student.status || "active",
});

export const assessAttendanceRowMatch = ({
  row,
  rowIndex = 0,
  studentLookups,
  batchNameLookup,
  fallbackBatch,
  resolutions = {},
  savedMappings = {},
}) => {
  const phone = normalizePhone(row.phone);
  const admission = clean(row.admissionNumber || row.studentCode).toLowerCase();
  const name = normalizeName(row.name);
  const batchName = clean(row.batchName).toLowerCase();
  const fallbackBatchId = String(fallbackBatch || "");
  const rowKey = getAttendanceImportRowKey(row, rowIndex);
  const isEligible = (student) =>
    student &&
    (!student.batch || String(student.batch) === fallbackBatchId) &&
    student.status !== "left";
  const eligible = (students = []) => students.filter(isEligible);
  const result = (status, reason, student = null, candidates = []) => ({
    rowKey,
    status,
    reason,
    student,
    candidates: candidates.map(serializeStudentCandidate),
  });

  const requestedStudentId = resolutions[rowKey] || savedMappings[rowKey] || "";
  const resolvedStudent = studentLookups.byId.get(String(requestedStudentId));
  if (resolutions[rowKey] === "__skip__") {
    return result("excluded", "Excluded by user");
  }
  if (resolvedStudent) {
    if (!isEligible(resolvedStudent)) {
      return result("needs-review", "Selected student does not belong to the destination batch");
    }
    return result(
      "matched",
      resolutions[rowKey] ? "Manually confirmed" : "Saved import mapping",
      resolvedStudent
    );
  }

  if (phone) {
    const candidates = eligible(studentLookups.phoneCandidates.get(phone));
    if (candidates.length === 1) {
      return result("matched", "Unique phone match", candidates[0]);
    }
    if (candidates.length > 1) {
      return result("needs-review", "Multiple students have this phone", null, candidates);
    }
  }

  if (admission) {
    const candidates = eligible(studentLookups.admissionCandidates.get(admission));
    if (candidates.length === 1) {
      return result("matched", "Unique admission/code match", candidates[0]);
    }
    if (candidates.length > 1) {
      return result("needs-review", "Duplicate admission/code found", null, candidates);
    }
  }

  if (name && batchName && batchNameLookup.has(batchName)) {
    const batch = batchNameLookup.get(batchName);
    const key = `${name}::${String(batch._id)}`;
    const candidates = eligible(studentLookups.nameBatchCandidates.get(key));
    if (candidates.length === 1) {
      return result("matched", "Exact name and batch match", candidates[0]);
    }
    if (candidates.length > 1) {
      return result("needs-review", "Duplicate name in batch", null, candidates);
    }
  }

  if (name && fallbackBatchId) {
    const candidates = eligible(
      studentLookups.nameBatchCandidates.get(`${name}::${fallbackBatchId}`)
    );
    if (candidates.length === 1) {
      return result("matched", "Exact name in selected batch", candidates[0]);
    }
    if (candidates.length > 1) {
      return result("needs-review", "Duplicate name in selected batch", null, candidates);
    }
  }

  if (name) {
    const candidates = eligible(studentLookups.nameCandidates.get(name));
    if (candidates.length === 1) {
      return result("matched", "Unique exact name match", candidates[0]);
    }
    if (candidates.length > 1) {
      return result("needs-review", "Multiple students have this name", null, candidates);
    }
  }

  const suggestions = name
    ? studentLookups.normalizedStudents
        .filter((item) => isEligible(item.student))
        .filter((item) => item.name.includes(name) || name.includes(item.name))
        .slice(0, 8)
        .map((item) => item.student)
    : [];

  return result("unmatched", "No safe exact match found", null, suggestions);
};

const normalizeImportStatus = (status) => {
  if (["present", "absent", "leave", "late"].includes(status)) return status;
  return null;
};

const getRecordIdentityKey = (record) => {
  if (record.student) {
    return `student:${String(record.student)}`;
  }

  if (record.importedSerialNo || record.importedName || record.importedPhone) {
    return `excel:${clean(record.importedSourceSheet)}:${clean(
      record.importedSerialNo
    )}:${normalizePhone(
      record.importedPhone
    )}:${normalizeName(record.importedName)}`;
  }

  if (record.importedRowNumber) {
    return `excel-row:${clean(record.importedSourceSheet)}:${record.importedRowNumber}`;
  }

  return `unknown:${Date.now()}:${Math.random()}`;
};

const getGroupKey = ({ batchId, date }) => `${batchId}::${date}`;

const IMPORTED_RECORD_METADATA_FIELDS = [
  "importedRowNumber",
  "importedSourceSheet",
  "importedSerialNo",
  "importedName",
  "importedPhone",
  "importedAdmissionNumber",
  "importedDueDate",
  "importedPaidDate",
  "importedFeePaid",
  "importedFeeStatus",
  "importedExtraNote",
];

// Skip-existing keeps the saved status, but completes blank Excel metadata.
export const backfillImportedAttendanceMetadata = (existing, incoming) => {
  let changed = false;

  IMPORTED_RECORD_METADATA_FIELDS.forEach((field) => {
    if (
      (existing[field] === undefined ||
        existing[field] === null ||
        clean(existing[field]) === "") &&
      incoming[field] !== undefined &&
      incoming[field] !== null &&
      clean(incoming[field]) !== ""
    ) {
      existing[field] = incoming[field];
      changed = true;
    }
  });

  if (incoming.source === "excel-import" && existing.source !== "excel-import") {
    existing.source = "excel-import";
    changed = true;
  }

  return changed;
};

const buildImportGroups = ({
  rows,
  studentLookups,
  batchNameLookup,
  summary,
  fallbackBatch,
  resolutions = {},
  savedMappings = {},
}) => {
  const groups = new Map();

  rows.forEach((row, rowIndex) => {
    try {
      const rowNumber = row.rowNumber || rowIndex + 2;
      const match = assessAttendanceRowMatch({
        row,
        rowIndex,
        studentLookups,
        batchNameLookup,
        fallbackBatch,
        resolutions,
        savedMappings,
      });
      const matchedStudent = match.student;

      const effectiveBatch = fallbackBatch;

      if (!effectiveBatch) {
        summary.failed += 1;
        summary.errors.push({
          rowNumber,
          name: clean(row.name),
          phone: normalizePhone(row.phone),
          admissionNumber: clean(row.admissionNumber || row.studentCode),
          message:
            "No batch found. Please select a batch before importing attendance.",
        });
        return;
      }

      if (!matchedStudent) {
        const validAttendanceCells = (Array.isArray(row.attendance) ? row.attendance : [])
          .filter((item) => normalizeImportStatus(item.status)).length;
        summary.unresolvedStudents += 1;
        summary.skipped += validAttendanceCells;
        summary.unmatchedStudents.push({
          rowKey: match.rowKey,
          rowNumber,
          sourceSheet: clean(row.sourceSheet),
          name: clean(row.name),
          phone: normalizePhone(row.phone),
          admissionNumber: clean(row.admissionNumber || row.studentCode),
          reason: match.reason,
        });
        return;
      } else if (!matchedStudent.batch && fallbackBatch) {
        summary.warnings.push({
          rowNumber,
          name: getStudentName(matchedStudent),
          admissionNumber: clean(matchedStudent.admissionNumber),
          message: "Student had no batch. Selected import batch was used.",
        });
      }

      const attendanceItems = Array.isArray(row.attendance) ? row.attendance : [];

      attendanceItems.forEach((item) => {
        const status = normalizeImportStatus(item.status);

        if (!status) {
          summary.skipped += 1;
          return;
        }

        const date = startOfDay(item.date);

        if (Number.isNaN(date.getTime())) {
          summary.failed += 1;
          summary.errors.push({
            rowNumber,
            message: `Invalid date: ${item.date}`,
          });
          return;
        }

        const isoDate = date.toISOString().slice(0, 10);
        const batchId = String(effectiveBatch);
        const key = getGroupKey({ batchId, date: isoDate });

        if (!groups.has(key)) {
          groups.set(key, {
            batch: effectiveBatch,
            date,
            records: [],
          });
        }

        groups.get(key).records.push({
          student: matchedStudent._id,

          importedRowNumber: Number(row.importedRowNumber || rowNumber),
          importedSourceSheet: clean(row.sourceSheet),
          importedSerialNo: clean(row.importedSerialNo || row.serialNo),
          importedName: clean(row.name),
          importedPhone: normalizePhone(row.phone),
          importedAdmissionNumber: clean(row.admissionNumber || row.studentCode),
          importedDueDate: clean(row.importedDueDate),
          importedPaidDate: clean(row.importedPaidDate),
          importedFeePaid: clean(row.importedFeePaid),
          importedFeeStatus: clean(row.importedFeeStatus),
          importedExtraNote: clean(row.importedExtraNote),

          status,
          source: "excel-import",
          note: "Imported from attendance Excel and matched with student",
        });

        summary.totalAttendanceCells += 1;
      });
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        rowNumber: row.rowNumber || rowIndex + 2,
        message: error.message || "Row failed",
      });
    }
  });

  return groups;
};

const saveImportGroup = async ({
  group,
  academyId,
  userId,
  duplicateMode,
  summary,
}) => {
  const attendance = await Attendance.findOne({
    academy: academyId,
    batch: group.batch,
    date: group.date,
  });

  if (!attendance) {
    const uniqueRecords = [];
    const seen = new Set();

    group.records.forEach((record) => {
      const recordKey = getRecordIdentityKey(record);

      if (seen.has(recordKey)) {
        summary.skipped += 1;
        return;
      }

      seen.add(recordKey);
      uniqueRecords.push(record);
    });

    await Attendance.create({
      academy: academyId,
      batch: group.batch,
      date: group.date,
      records: uniqueRecords,
      markedBy: userId,
      updatedBy: userId,
    });

    summary.imported += uniqueRecords.length;
    return;
  }

  const totalsBeforeSave = { imported: summary.imported, skipped: summary.skipped, metadataUpdated: summary.metadataUpdated };
  const existingMap = new Map();

  attendance.records.forEach((record, index) => {
    existingMap.set(getRecordIdentityKey(record), index);
  });

  group.records.forEach((record) => {
    const recordKey = getRecordIdentityKey(record);
    const legacyRawKey = record.student
      ? getRecordIdentityKey({ ...record, student: null })
      : "";
    const existingIndex = existingMap.has(recordKey)
      ? existingMap.get(recordKey)
      : legacyRawKey && existingMap.has(legacyRawKey)
        ? existingMap.get(legacyRawKey)
        : null;

    if (existingIndex !== null) {
      const existingRecord = attendance.records[existingIndex];
      const metadataBackfilled = backfillImportedAttendanceMetadata(
        existingRecord,
        record
      );
      const linkedLegacyRecord =
        Boolean(record.student) &&
        !existingRecord.student;

      if (linkedLegacyRecord) {
        attendance.records[existingIndex].student = record.student;
        attendance.records[existingIndex].source = "excel-import";
        attendance.records[existingIndex].note =
          "Verified and linked to Student Record during attendance import";
        existingMap.delete(legacyRawKey);
        existingMap.set(recordKey, existingIndex);
      }

      if (duplicateMode === "overwrite") {
        const index = existingIndex;

        attendance.records[index].student = record.student || null;
        attendance.records[index].importedRowNumber =
          record.importedRowNumber || null;
        attendance.records[index].importedSourceSheet =
          record.importedSourceSheet || "";
        attendance.records[index].importedSerialNo = record.importedSerialNo || "";
        attendance.records[index].importedName = record.importedName || "";
        attendance.records[index].importedPhone = record.importedPhone || "";
        attendance.records[index].importedAdmissionNumber =
          record.importedAdmissionNumber || "";
        attendance.records[index].importedDueDate = record.importedDueDate || "";
        attendance.records[index].importedPaidDate = record.importedPaidDate || "";
        attendance.records[index].importedFeePaid = record.importedFeePaid || "";
        attendance.records[index].importedFeeStatus =
          record.importedFeeStatus || "";
        attendance.records[index].importedExtraNote =
          record.importedExtraNote || "";
        attendance.records[index].status = record.status;
        attendance.records[index].source = record.source || "excel-import";
        attendance.records[index].note = record.note || "";

        summary.imported += 1;
      } else if (linkedLegacyRecord) {
        summary.imported += 1;
      } else {
        summary.skipped += 1;
        if (metadataBackfilled) summary.metadataUpdated += 1;
      }

      return;
    }

    attendance.records.push(record);
    existingMap.set(recordKey, attendance.records.length - 1);
    summary.imported += 1;
  });

  attendance.updatedBy = userId;
  try { await attendance.save(); }
  catch (error) { Object.assign(summary, totalsBeforeSave); throw error; }
};

export const markAttendance = asyncHandler(async (req, res) => {
  const { batch: batchId, date, records } = req.body;

  const batch = await Batch.findOne({
    _id: batchId,
    academy: req.academyId,
  });

  if (!batch) {
    return errorResponse(res, "Batch not found in your academy", 404);
  }

  const normalizedRecords = Array.isArray(records) ? records : [];
  const studentIds = normalizedRecords
    .map((record) => record.student)
    .filter(Boolean);

  const uniqueStudentIds = [...new Set(studentIds.map(String))];

  const students = await Student.find({
    _id: { $in: uniqueStudentIds },
    academy: req.academyId,
    batch: batchId,
    status: { $ne: "left" },
  }).select("_id");

  if (students.length !== uniqueStudentIds.length) {
    return errorResponse(
      res,
      "All attendance students must belong to the selected batch and academy",
      400
    );
  }

  const attendanceDate = startOfDay(date);

  const attendance = await Attendance.findOneAndUpdate(
    {
      academy: req.academyId,
      batch: batchId,
      date: attendanceDate,
    },
    {
      $set: {
        records: normalizedRecords,
        updatedBy: req.user._id,
      },
      $setOnInsert: {
        academy: req.academyId,
        batch: batchId,
        date: attendanceDate,
        markedBy: req.user._id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  )
    .populate("batch", "batchName martialArt")
    .populate("records.student", "firstName lastName admissionNumber phone");

  return successResponse(res, "Attendance marked successfully", {
    attendance,
  });
});

export const previewAttendanceImport = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const fallbackBatch = req.body?.fallbackBatch || null;
  const resolutions =
    req.body?.resolutions && typeof req.body.resolutions === "object"
      ? req.body.resolutions
      : {};

  if (!fallbackBatch) {
    return errorResponse(res, "Please select an attendance destination batch", 400);
  }

  const batch = await Batch.findOne({
    _id: fallbackBatch,
    academy: req.academyId,
  }).select("_id batchName");

  if (!batch) {
    return errorResponse(res, "Selected attendance batch not found", 404);
  }

  const studentLookups = await buildStudentLookups(req.academyId);
  const batchNameLookup = await buildBatchNameLookup(req.academyId);
  const savedMappings = await getSavedAttendanceMappings({
    academyId: req.academyId,
    batchId: batch._id,
    rows,
  });
  const matches = rows.map((row, rowIndex) => {
    const match = assessAttendanceRowMatch({
      row,
      rowIndex,
      studentLookups,
      batchNameLookup,
      fallbackBatch: batch._id,
      resolutions,
      savedMappings,
    });
    const attendanceCells = (Array.isArray(row.attendance) ? row.attendance : [])
      .filter((item) => normalizeImportStatus(item.status)).length;

    return {
      ...match,
      rowNumber: Number(row.importedRowNumber || row.rowNumber || rowIndex + 2),
      sourceSheet: clean(row.sourceSheet),
      name: clean(row.name),
      phone: normalizePhone(row.phone),
      admissionNumber: clean(row.admissionNumber || row.studentCode),
      attendanceCells,
      student: match.student ? serializeStudentCandidate(match.student) : null,
    };
  });

  const availableStudents = studentLookups.normalizedStudents
    .map((item) => item.student)
    .filter(
      (student) =>
        student.status !== "left" &&
        (!student.batch || String(student.batch) === String(batch._id))
    )
    .sort((a, b) => getStudentName(a).localeCompare(getStudentName(b)))
    .map(serializeStudentCandidate);

  const count = (status) => matches.filter((match) => match.status === status).length;

  return successResponse(res, "Attendance import preview ready", {
    batch: { _id: String(batch._id), batchName: batch.batchName },
    summary: {
      totalRows: matches.length,
      totalAttendanceCells: matches.reduce(
        (sum, match) => sum + match.attendanceCells,
        0
      ),
      matched: count("matched"),
      needsReview: count("needs-review"),
      unmatched: count("unmatched"),
      excluded: count("excluded"),
    },
    matches,
    availableStudents,
  });
});

export const importOldAttendance = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const duplicateMode =
    req.body?.duplicateMode === "overwrite" ? "overwrite" : "skip";
  const fallbackBatch = req.body?.fallbackBatch || null;
  const resolutions =
    req.body?.resolutions && typeof req.body.resolutions === "object"
      ? req.body.resolutions
      : {};

  const summary = {
    totalRows: rows.length,
    totalAttendanceCells: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    metadataUpdated: 0,
    rawImportedStudents: 0,
    unresolvedStudents: 0,
    unmatchedStudents: [],
    warnings: [],
    errors: [],
  };

  if (!rows.length) {
    return successResponse(res, "Attendance import completed", summary);
  }

  if (!fallbackBatch) {
    return errorResponse(
      res,
      "Please select a batch before importing old attendance",
      400
    );
  }

  const batch = await Batch.findOne({
    _id: fallbackBatch,
    academy: req.academyId,
  }).select("_id");

  if (!batch) {
    return errorResponse(res, "Selected import batch not found", 404);
  }

  const studentLookups = await buildStudentLookups(req.academyId);
  const batchNameLookup = await buildBatchNameLookup(req.academyId);
  const savedMappings = await getSavedAttendanceMappings({
    academyId: req.academyId,
    batchId: batch._id,
    rows,
  });

  const unresolved = rows
    .map((row, rowIndex) =>
      assessAttendanceRowMatch({
        row,
        rowIndex,
        studentLookups,
        batchNameLookup,
        fallbackBatch: batch._id,
        resolutions,
        savedMappings,
      })
    )
    .filter((match) => !["matched", "excluded"].includes(match.status));

  if (unresolved.length) {
    return errorResponse(
      res,
      `Resolve or exclude all unmatched students before import (${unresolved.length} remaining)`,
      409,
      { unresolved: unresolved.slice(0, 200) }
    );
  }

  const groups = buildImportGroups({
    rows,
    studentLookups,
    batchNameLookup,
    summary,
    fallbackBatch: batch._id,
    resolutions,
    savedMappings,
  });

  for (const group of groups.values()) {
    try {
      await saveImportGroup({
        group,
        academyId: req.academyId,
        userId: req.user._id,
        duplicateMode,
        summary,
      });
    } catch (error) {
      summary.failed += group.records.length;
      summary.errors.push({
        batch: String(group.batch),
        date: group.date.toISOString().slice(0, 10),
        message: error.message || "Group import failed",
      });
    }
  }

  const confirmedMappingOperations = rows.flatMap((row, rowIndex) => {
    const sourceKey = getAttendanceImportRowKey(row, rowIndex);
    const studentId = resolutions[sourceKey];
    if (!studentId || studentId === "__skip__") return [];

    return [{
      updateOne: {
        filter: {
          academy: req.academyId,
          batch: batch._id,
          sourceKey,
        },
        update: {
          $set: {
            student: studentId,
            sourceSheet: clean(row.sourceSheet),
            importedName: clean(row.name),
            importedPhone: normalizePhone(row.phone),
            confirmedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }];
  });

  if (confirmedMappingOperations.length) {
    await AttendanceImportMapping.bulkWrite(confirmedMappingOperations, {
      ordered: false,
    });
  }

  if (summary.warnings.length > 200) {
    summary.warnings = summary.warnings.slice(0, 200);
    summary.warnings.push({
      message: "Warnings trimmed to first 200 items.",
    });
  }

  if (summary.unmatchedStudents.length > 500) {
    summary.unmatchedStudents = summary.unmatchedStudents.slice(0, 500);
    summary.unmatchedStudentsTrimmed = true;
  }

  if (summary.errors.length > 100) {
    summary.errors = summary.errors.slice(0, 100);
    summary.errors.push({
      message: "Errors trimmed to first 100 items.",
    });
  }

  return successResponse(res, "Attendance import completed", summary);
});

export const getAttendance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.academyId) filter.academy = req.academyId;
  if (req.query.batch) filter.batch = req.query.batch;

  const dateFilter = buildDateFilter(req.query);
  if (dateFilter) filter.date = dateFilter;

  const attendance = await Attendance.find(filter)
    .sort({ date: -1 })
    .populate("batch", "batchName martialArt")
    .populate("records.student", "firstName lastName admissionNumber phone");

  return successResponse(res, "Attendance fetched successfully", {
    attendance,
  });
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentFilter = { _id: req.params.studentId };
  if (req.academyId) studentFilter.academy = req.academyId;

  const student = await Student.findOne(studentFilter);

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const filter = {
    academy: student.academy,
    "records.student": student._id,
  };

  const dateFilter = buildDateFilter(req.query);
  if (dateFilter) filter.date = dateFilter;

  const attendance = await Attendance.find(filter)
    .sort({ date: -1 })
    .populate("batch", "batchName martialArt")
    .lean();

  const history = attendance.map((item) => ({
    _id: item._id,
    academy: item.academy,
    batch: item.batch,
    date: item.date,
    record: item.records.find(
      (record) => String(record.student) === String(student._id)
    ),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return successResponse(res, "Student attendance fetched successfully", {
    student,
    history,
  });
});

export const getStudentYearlyProfile = asyncHandler(async (req, res) => {
  const { year } = req.query;

  const data = await getStudentYearlyAttendanceProfile({
    academyId: req.academyId,
    studentId: req.params.studentId,
    year: year || new Date().getFullYear(),
  });

  return successResponse(res, "Student yearly attendance profile fetched", data);
});

export const getBatchAttendance = asyncHandler(async (req, res) => {
  const batchFilter = { _id: req.params.batchId };
  if (req.academyId) batchFilter.academy = req.academyId;

  const batch = await Batch.findOne(batchFilter);

  if (!batch) {
    return errorResponse(res, "Batch not found", 404);
  }

  const filter = {
    academy: batch.academy,
    batch: batch._id,
  };

  const dateFilter = buildDateFilter(req.query);
  if (dateFilter) filter.date = dateFilter;

  const attendance = await Attendance.find(filter)
    .sort({ date: -1 })
    .populate("records.student", "firstName lastName admissionNumber phone");

  return successResponse(res, "Batch attendance fetched successfully", {
    batch,
    attendance,
  });
});

export const getMonthlyRegister = asyncHandler(async (req, res) => {
  const { batch, month, year } = req.query;

  const data = await getMonthlyAttendanceRegister({
    academyId: req.academyId,
    batchId: batch,
    month,
    year,
  });

  return successResponse(res, "Monthly attendance register fetched", data);
});

export const getYearlyRegister = asyncHandler(async (req, res) => {
  const { batch, year } = req.query;

  const data = await getYearlyAttendanceRegister({
    academyId: req.academyId,
    batchId: batch,
    year,
  });

  return successResponse(res, "Yearly attendance register fetched", data);
});

export const saveMonthlyRegister = asyncHandler(async (req, res) => {
  const { batch, month, year, rows } = req.body;

  const data = await saveMonthlyAttendanceRegister({
    academyId: req.academyId,
    batchId: batch,
    month,
    year,
    rows,
    userId: req.user._id,
  });

  return successResponse(res, "Monthly attendance register saved", data);
});

export const moveMonthlyRegisterRow = asyncHandler(async (req, res) => {
  const { batch, month, year, rowKey, position, revision } = req.body;
  const data = await moveMonthlyAttendanceRow({ academyId: req.academyId, batchId: batch, month, year, rowKey, position, revision });
  return successResponse(res, "Attendance row order saved", data);
});

export const upsertAttendanceDayNote = asyncHandler(async (req, res) => {
  const batchId = req.body?.batch;
  const date = parseDateKey(req.body?.date);
  const type = clean(req.body?.type).toLowerCase();
  const title = clean(req.body?.title).slice(0, 100);
  const description = clean(req.body?.description).slice(0, 500);
  const color = clean(req.body?.color);

  if (!date) return errorResponse(res, "Valid date is required", 400);
  if (!DAY_NOTE_TYPES.has(type)) {
    return errorResponse(res, "Invalid holiday/note type", 400);
  }
  if (!title) return errorResponse(res, "Holiday title is required", 400);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return errorResponse(res, "Valid six-digit HEX color is required", 400);
  }

  const batch = await Batch.findOne({ _id: batchId, academy: req.academyId })
    .select("_id");
  if (!batch) return errorResponse(res, "Batch not found", 404);

  const note = await AttendanceDayNote.findOneAndUpdate(
    { academy: req.academyId, batch: batch._id, date },
    {
      $set: { type, title, description, color, updatedBy: req.user._id },
      $setOnInsert: {
        academy: req.academyId,
        batch: batch._id,
        date,
        createdBy: req.user._id,
      },
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return successResponse(res, "Holiday/note saved", {
    ...note,
    date: note.date.toISOString().slice(0, 10),
  });
});

export const removeAttendanceDayNote = asyncHandler(async (req, res) => {
  const date = parseDateKey(req.body?.date);
  if (!date) return errorResponse(res, "Valid date is required", 400);

  const deleted = await AttendanceDayNote.findOneAndDelete({
    academy: req.academyId,
    batch: req.body?.batch,
    date,
  });

  if (!deleted) return errorResponse(res, "Holiday/note not found", 404);
  return successResponse(res, "Holiday/note removed", {
    date: deleted.date.toISOString().slice(0, 10),
  });
});
