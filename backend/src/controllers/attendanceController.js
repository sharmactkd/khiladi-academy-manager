import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  getMonthlyAttendanceRegister,
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

const normalizeName = (value) => clean(value).toLowerCase();

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

  students.forEach((student) => {
    const phone = normalizePhone(student.phone);
    const admission = clean(student.admissionNumber).toLowerCase();
    const name = normalizeName(getStudentName(student));
    const batchKey = student.batch ? String(student.batch) : "";

    if (phone && !byPhone.has(phone)) {
      byPhone.set(phone, student);
    }

    if (admission && !byAdmission.has(admission)) {
      byAdmission.set(admission, student);
    }

    if (name && !byName.has(name)) {
      byName.set(name, student);
    }

    if (name && batchKey) {
      byNameBatch.set(`${name}::${batchKey}`, student);
    }
  });

  return {
    byPhone,
    byAdmission,
    byName,
    byNameBatch,
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

const findMatchedStudent = ({
  row,
  studentLookups,
  batchNameLookup,
}) => {
  const phone = normalizePhone(row.phone);
  const admission = clean(row.admissionNumber || row.studentCode).toLowerCase();
  const name = normalizeName(row.name);
  const batchName = clean(row.batchName).toLowerCase();

  if (phone && studentLookups.byPhone.has(phone)) {
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

  if (name && studentLookups.byName.has(name)) {
    return studentLookups.byName.get(name);
  }

  return null;
};

const normalizeImportStatus = (status) => {
  if (["present", "absent", "leave"].includes(status)) return status;
  return null;
};

const getGroupKey = ({ batchId, date }) => `${batchId}::${date}`;

const buildImportGroups = async ({
  rows,
  academyId,
  studentLookups,
  batchNameLookup,
  summary,
  fallbackBatch,
  assignMissingBatch,
}) => {
  const groups = new Map();

  rows.forEach((row, rowIndex) => {
    try {
      const rowNumber = row.rowNumber || rowIndex + 2;
      const student = findMatchedStudent({
        row,
        studentLookups,
        batchNameLookup,
      });

      if (!student) {
        summary.unmatchedStudents.push({
          rowNumber,
          name: clean(row.name),
          phone: normalizePhone(row.phone),
          admissionNumber: clean(row.admissionNumber || row.studentCode),
          reason: "Student not found",
        });
        return;
      }

    let effectiveBatch = student.batch;

if (!effectiveBatch && fallbackBatch) {
  effectiveBatch = fallbackBatch;

  if (assignMissingBatch) {
    student.batch = fallbackBatch;
  }

  summary.warnings.push({
    rowNumber,
    name: getStudentName(student),
    admissionNumber: clean(student.admissionNumber),
    message: "Student had no batch. Selected import batch was used.",
  });
}

if (!effectiveBatch) {
  summary.unmatchedStudents.push({
    rowNumber,
    name: getStudentName(student),
    phone: normalizePhone(student.phone),
    admissionNumber: clean(student.admissionNumber),
    reason: "Matched student has no batch, attendance skipped",
  });
  return;
}

      const attendanceItems = Array.isArray(row.attendance)
        ? row.attendance
        : [];

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
          student: student._id,
          status,
          note: "Imported from old attendance Excel",
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
      const studentId = String(record.student);

      if (seen.has(studentId)) {
        summary.skipped += 1;
        return;
      }

      seen.add(studentId);
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
    existingMap.set(String(record.student), index);
  });

  group.records.forEach((record) => {
    const studentId = String(record.student);

    if (existingMap.has(studentId)) {
      if (duplicateMode === "overwrite") {
        const index = existingMap.get(studentId);
        attendance.records[index].status = record.status;
        attendance.records[index].note = record.note;
        summary.imported += 1;
      } else {
        summary.skipped += 1;
      }

      return;
    }

    attendance.records.push(record);
    existingMap.set(studentId, attendance.records.length - 1);
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

  const studentIds = (records || []).map((record) => record.student);

  const students = await Student.find({
    _id: { $in: studentIds },
    academy: req.academyId,
    batch: batchId,
    status: { $ne: "left" },
  }).select("_id");

  if (students.length !== studentIds.length) {
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
        records,
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

  const summary = {
    totalRows: rows.length,
    totalAttendanceCells: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    unmatchedStudents: [],
    warnings: [],
    errors: [],
  };

  if (!rows.length) {
    return successResponse(res, "Attendance import completed", summary);
  }

  const fallbackBatch = req.body?.fallbackBatch || null;
const assignMissingBatch = Boolean(req.body?.assignMissingBatch);

  const studentLookups = await buildStudentLookups(req.academyId);
  const batchNameLookup = await buildBatchNameLookup(req.academyId);

const groups = await buildImportGroups({
  rows,
  academyId: req.academyId,
  studentLookups,
  batchNameLookup,
  summary,
  fallbackBatch,
  assignMissingBatch,
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

  if (summary.unmatchedStudents.length > 100) {
    summary.warnings.push(
      `${summary.unmatchedStudents.length} unmatched students found. Showing first 100 only.`
    );
    summary.unmatchedStudents = summary.unmatchedStudents.slice(0, 100);
  }

  if (summary.errors.length > 100) {
    summary.warnings.push(
      `${summary.errors.length} errors found. Showing first 100 only.`
    );
    summary.errors = summary.errors.slice(0, 100);
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