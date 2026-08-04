import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  getMonthlyAttendanceRegister,
  getStudentYearlyAttendanceProfile,
  getYearlyAttendanceRegister,
  saveMonthlyAttendanceRegister,
} from "../services/monthlyAttendanceService.js";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildDateFilter = (query) => {
  const filter = {};

  if (query.from || query.to) {
    filter.$gte = query.from ? startOfDay(query.from) : new Date("1970-01-01");

    if (query.to) {
      const to = startOfDay(query.to);
      to.setHours(23, 59, 59, 999);
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

const getStudentName = (student) =>
  clean(`${student.firstName || ""} ${student.lastName || ""}`);

const buildStudentLookups = async (academyId) => {
  const students = await Student.find({
    academy: academyId,
  }).select("_id firstName lastName admissionNumber phone batch status");

  const byPhone = new Map();
  const byAdmission = new Map();
  const byName = new Map();
  const byNameBatch = new Map();
  const ambiguousPhones = new Set();
  const ambiguousNames = new Set();
  const normalizedStudents = [];

  students.forEach((student) => {
    const phone = normalizePhone(student.phone);
    const admission = clean(student.admissionNumber).toLowerCase();
    const name = normalizeName(getStudentName(student));
    const batchKey = student.batch ? String(student.batch) : "";

    if (phone && byPhone.has(phone)) ambiguousPhones.add(phone);
    if (phone && !byPhone.has(phone)) byPhone.set(phone, student);
    if (admission && !byAdmission.has(admission)) byAdmission.set(admission, student);
    if (name && byName.has(name)) ambiguousNames.add(name);
    if (name && !byName.has(name)) byName.set(name, student);
    if (name && batchKey) byNameBatch.set(`${name}::${batchKey}`, student);

    normalizedStudents.push({
      student,
      phone,
      admission,
      name,
      batchKey,
    });
  });

  return {
    byPhone,
    byAdmission,
    byName,
    byNameBatch,
    normalizedStudents,
    ambiguousPhones,
    ambiguousNames,
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

const findFuzzyStudentByName = ({ name, studentLookups }) => {
  if (!name || name.length < 3) return null;

  const exact = studentLookups.byName.get(name);
  if (exact) return exact;

  const candidates = studentLookups.normalizedStudents.filter((item) => {
    if (!item.name || item.name.length < 3) return false;
    return item.name.includes(name) || name.includes(item.name);
  });

  return candidates.length === 1 ? candidates[0].student : null;
};

const findMatchedStudent = ({
  row,
  studentLookups,
  batchNameLookup,
  strictMatching = false,
}) => {
  const phone = normalizePhone(row.phone);
  const admission = clean(row.admissionNumber || row.studentCode).toLowerCase();
  const name = normalizeName(row.name);
  const batchName = clean(row.batchName).toLowerCase();

  if (
    phone &&
    !studentLookups.ambiguousPhones.has(phone) &&
    studentLookups.byPhone.has(phone)
  ) {
    return studentLookups.byPhone.get(phone);
  }

  if (admission && studentLookups.byAdmission.has(admission)) {
    return studentLookups.byAdmission.get(admission);
  }

  if (name && batchName && batchNameLookup.has(batchName)) {
    const batch = batchNameLookup.get(batchName);
    const key = `${name}::${String(batch._id)}`;

    if (studentLookups.byNameBatch.has(key)) {
      return studentLookups.byNameBatch.get(key);
    }
  }

  if (
    name &&
    !studentLookups.ambiguousNames.has(name) &&
    studentLookups.byName.has(name)
  ) {
    return studentLookups.byName.get(name);
  }

  return strictMatching
    ? null
    : findFuzzyStudentByName({ name, studentLookups });
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

const buildImportGroups = ({
  rows,
  studentLookups,
  batchNameLookup,
  summary,
  fallbackBatch,
  strictMatching = false,
}) => {
  const groups = new Map();

  rows.forEach((row, rowIndex) => {
    try {
      const rowNumber = row.rowNumber || rowIndex + 2;
      const matchedStudent = findMatchedStudent({
        row,
        studentLookups,
        batchNameLookup,
        strictMatching,
      });

      const effectiveBatch = matchedStudent?.batch || fallbackBatch;

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
        summary.rawImportedStudents += 1;
        summary.unmatchedStudents.push({
          rowNumber,
          sourceSheet: clean(row.sourceSheet),
          name: clean(row.name),
          phone: normalizePhone(row.phone),
          admissionNumber: clean(row.admissionNumber || row.studentCode),
        });
        summary.warnings.push({
          rowNumber,
          name: clean(row.name),
          phone: normalizePhone(row.phone),
          admissionNumber: clean(row.admissionNumber || row.studentCode),
          message:
            "Student master record not found. Attendance saved as raw Excel record.",
        });
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
          student: matchedStudent?._id || null,

          importedRowNumber: Number(row.importedRowNumber || rowNumber),
          importedSourceSheet: clean(row.sourceSheet),
          importedSerialNo: clean(row.importedSerialNo || row.serialNo),
          importedName: clean(row.name),
          importedPhone: normalizePhone(row.phone),
          importedAdmissionNumber: clean(row.admissionNumber || row.studentCode),
          importedPaidDate: clean(row.importedPaidDate),
          importedFeePaid: clean(row.importedFeePaid),
          importedFeeStatus: clean(row.importedFeeStatus),
          importedExtraNote: clean(row.importedExtraNote),

          status,
          source: "excel-import",
          note: matchedStudent
            ? "Imported from old attendance Excel and matched with student"
            : "Imported from old attendance Excel as raw record",
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

  const existingMap = new Map();

  attendance.records.forEach((record, index) => {
    existingMap.set(getRecordIdentityKey(record), index);
  });

  group.records.forEach((record) => {
    const recordKey = getRecordIdentityKey(record);

    if (existingMap.has(recordKey)) {
      if (duplicateMode === "overwrite") {
        const index = existingMap.get(recordKey);

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
      } else {
        summary.skipped += 1;
      }

      return;
    }

    attendance.records.push(record);
    existingMap.set(recordKey, attendance.records.length - 1);
    summary.imported += 1;
  });

  attendance.updatedBy = userId;
  await attendance.save();
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

export const importOldAttendance = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const duplicateMode =
    req.body?.duplicateMode === "overwrite" ? "overwrite" : "skip";
  const fallbackBatch = req.body?.fallbackBatch || null;
  const strictMatching = req.body?.strictMatching === true;

  const summary = {
    totalRows: rows.length,
    totalAttendanceCells: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    rawImportedStudents: 0,
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

  const groups = buildImportGroups({
    rows,
    studentLookups,
    batchNameLookup,
    summary,
    fallbackBatch: batch._id,
    strictMatching,
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
