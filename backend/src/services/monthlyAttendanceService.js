import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePayment from "../models/FeePayment.js";
import AttendanceDayNote from "../models/AttendanceDayNote.js";
import AttendanceRowOrder from "../models/AttendanceRowOrder.js";
import AttendanceMonthMetadata from "../models/AttendanceMonthMetadata.js";
import { applyRowOrder, moveRowKeys } from "../utils/attendanceRowOrder.js";
import { getMembershipMap } from "./membershipService.js";
import { resolveFeeStatus } from "../utils/feeStatus.js";
import { todayDateKey } from "../utils/businessDate.js";

const STATUS_MAP = {
  present: "P",
  absent: "A",
  leave: "L",
  late: "LT",
  P: "present",
  A: "absent",
  L: "leave",
  LT: "late",
};

const SHORT_STATUSES = ["P", "A", "L", "LT", ""];

export const REGISTER_MONTHS = [
  { value: 1, label: "Jan", fullLabel: "January" },
  { value: 2, label: "Feb", fullLabel: "February" },
  { value: 3, label: "Mar", fullLabel: "March" },
  { value: 4, label: "Apr", fullLabel: "April" },
  { value: 5, label: "May", fullLabel: "May" },
  { value: 6, label: "Jun", fullLabel: "June" },
  { value: 7, label: "Jul", fullLabel: "July" },
  { value: 8, label: "Aug", fullLabel: "August" },
  { value: 9, label: "Sep", fullLabel: "September" },
  { value: 10, label: "Oct", fullLabel: "October" },
  { value: 11, label: "Nov", fullLabel: "November" },
  { value: 12, label: "Dec", fullLabel: "December" },
];

const toObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(String(value || ""))) return null;
  return new mongoose.Types.ObjectId(value);
};

const pad = (value) => String(value).padStart(2, "0");

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizePhone = (value) => clean(value).replace(/\D/g, "").slice(-10);

const normalizeIdentityPart = (value) => clean(value).toLowerCase();

export const getAttendanceRegisterRowKey = (value = {}) => {
  const linkedStudentId =
    value.student || (value.rowType !== "raw-import" ? value.studentId : "");

  if (linkedStudentId) return `student:${String(linkedStudentId)}`;

  const sourceSheet = normalizeIdentityPart(value.importedSourceSheet);
  const rowNumber = Number(value.importedRowNumber || 0);
  if (rowNumber > 0) {
    return `import:${sourceSheet || "sheet"}:row:${rowNumber}`;
  }

  const admissionNumber = normalizeIdentityPart(value.importedAdmissionNumber);
  if (admissionNumber) {
    return `import:${sourceSheet}:admission:${admissionNumber}`;
  }

  const serialNo = normalizeIdentityPart(value.importedSerialNo || value.no);
  const phone = normalizePhone(value.importedPhone || value.contact);
  const name = normalizeIdentityPart(value.importedName || value.name);
  return `import:${sourceSheet}:identity:${serialNo}:${phone}:${name}`;
};

// Attendance dates are stored as UTC-midnight values. Always derive register
// keys and ranges in UTC as well; using the server's local timezone can move a
// saved mark to the previous day (or even the previous month) after reload.
const formatDateKey = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;

const getLocalDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateKey(date);
};

const formatDisplayDate = (value) => {
  if (!value) return "";

  const raw = clean(value);
  if (!raw || raw === "-") return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yy] = slash;
    const yyyy = String(yy).length === 2 ? `20${yy}` : yy;
    return `${pad(dd)}-${pad(mm)}-${yyyy}`;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dash) {
    const [, dd, mm, yy] = dash;
    const yyyy = String(yy).length === 2 ? `20${yy}` : yy;
    return `${pad(dd)}-${pad(mm)}-${yyyy}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date.getUTCFullYear()}`;
  }

  return raw;
};

const getMonthRange = ({ year, month }) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  const start = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
  const end = new Date(Date.UTC(numericYear, numericMonth, 1));

  return { start, end };
};

const buildDays = ({ year, month }) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const lastDay = new Date(Date.UTC(numericYear, numericMonth, 0)).getUTCDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = new Date(Date.UTC(numericYear, numericMonth - 1, day));
    const dateKey = `${numericYear}-${pad(numericMonth)}-${pad(day)}`;

    return {
      day,
      dateKey,
      weekday: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      isSunday: date.getUTCDay() === 0,
      isSaturday: date.getUTCDay() === 6,
      isToday: todayDateKey() === dateKey,
    };
  });
};

const normalizeShortStatus = (value) => {
  const status = String(value || "").trim().toUpperCase();
  return SHORT_STATUSES.includes(status) ? status : "";
};

const toLongStatus = (shortStatus) => STATUS_MAP[shortStatus] || null;
const toShortStatus = (longStatus) => STATUS_MAP[longStatus] || "";

const calculateCounts = (attendance = {}) => {
  const values = Object.values(attendance);

  const presentCount = values.filter((value) => value === "P").length;
  const absentCount = values.filter((value) => value === "A").length;
  const leaveCount = values.filter((value) => value === "L").length;
  const lateCount = values.filter((value) => value === "LT").length;

  const markedDays = presentCount + absentCount + leaveCount + lateCount;
  const attendancePercentage =
    markedDays > 0 ? Math.round((presentCount / markedDays) * 100) : 0;

  return {
    presentCount,
    absentCount,
    leaveCount,
    lateCount,
    attendancePercentage,
  };
};

const getStudentName = (student) => {
  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
};

const buildBlankAttendance = (days = []) => {
  const attendance = {};

  days.forEach((day) => {
    attendance[day.dateKey] = "";
  });

  return attendance;
};

const getMonthlyFeeMap = async ({ academyId, studentIds, month, year, latest = false }) => {
  if (!studentIds.length) return new Map();

  const query = {
    academy: academyId,
    student: { $in: studentIds },
    status: { $ne: "cancelled" },
  };
  if (!latest) {
    query.feeMonth = Number(month);
    query.feeYear = Number(year);
  }

  const payments = await FeePayment.find(query)
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();

  const map = new Map();

  payments.forEach((payment) => {
    const key = String(payment.student);
    if (!map.has(key)) map.set(key, payment);
  });

  return map;
};

const getRecordDisplayIdentity = (record = {}, studentMap = new Map()) => {
  const student = record.student ? studentMap.get(String(record.student)) : null;

  return {
    rowId: getAttendanceRegisterRowKey(record),
    student,
    studentId: record.student ? String(record.student) : "",
    rowType: record.student ? "student" : "raw-import",
    importedRowNumber: record.importedRowNumber || null,
    importedSourceSheet: record.importedSourceSheet || "",
    importedSerialNo: record.importedSerialNo || "",
    importedName: record.importedName || "",
    importedPhone: record.importedPhone || "",
    importedAdmissionNumber: record.importedAdmissionNumber || "",
    importedDueDate: record.importedDueDate || "",
    importedPaidDate: record.importedPaidDate || "",
    importedFeePaid: record.importedFeePaid || "",
    importedFeeStatus: record.importedFeeStatus || "",
    importedExtraNote: record.importedExtraNote || "",
    source: record.source || "manual",
  };
};

const IMPORTED_IDENTITY_FIELDS = [
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

// Student roster rows are inserted before attendance records. Enrich that
// existing identity instead of discarding metadata from linked Excel records.
export const mergeMonthlyRecordIdentity = (existing = {}, incoming = {}) => {
  const merged = { ...existing };

  if (!merged.student && incoming.student) merged.student = incoming.student;
  if (!merged.studentId && incoming.studentId) merged.studentId = incoming.studentId;
  if (incoming.rowType === "student") merged.rowType = "student";
  if (incoming.source === "excel-import") merged.source = "excel-import";

  if (
    incoming.importedRowNumber &&
    (!merged.importedRowNumber ||
      Number(incoming.importedRowNumber) < Number(merged.importedRowNumber))
  ) {
    merged.importedRowNumber = incoming.importedRowNumber;
  }

  IMPORTED_IDENTITY_FIELDS.forEach((field) => {
    if (!clean(merged[field]) && clean(incoming[field])) {
      merged[field] = incoming[field];
    }
  });

  return merged;
};

export const buildRowFromRecord = ({ identity, attendance, index, fee, membership }) => {
  const student = identity.student;
  const counts = calculateCounts(attendance);

  const importedName = clean(identity.importedName);
  const importedPhone = clean(identity.importedPhone);
  const normalizedDueDate = clean(identity.importedDueDate);
  const normalizedPaidDate = clean(identity.importedPaidDate);
  const isLinkedStudent = identity.rowType === "student" && Boolean(identity.studentId);
  const hasFeeTruth = Boolean(membership || fee || clean(identity.importedFeeStatus));
  const feeStatusSummary = hasFeeTruth ? resolveFeeStatus({
    membership,
    payableAmount: fee ? Number(fee.finalAmount ?? fee.amount ?? 0) : null,
    paidAmount: fee ? Number(fee.amountPaid || 0) : null,
    fallbackStatus: membership?.feeStatus || fee?.status || identity.importedFeeStatus || "due",
  }) : null;

  return {
    no: identity.importedSerialNo || index + 1,
    sortOrder: Number(identity.importedRowNumber || index + 1),
    studentId: identity.studentId || identity.rowId,
    rowType: identity.rowType,
    source: identity.source,

    importedRowNumber: identity.importedRowNumber,
    importedSourceSheet: identity.importedSourceSheet || "",
    importedSerialNo: identity.importedSerialNo,
    importedName,
    importedPhone,
    importedAdmissionNumber: identity.importedAdmissionNumber,
    importedDueDate: normalizedDueDate,
    importedPaidDate: normalizedPaidDate,
    importedFeePaid: "",
    importedFeeStatus: identity.importedFeeStatus,
    importedExtraNote: identity.importedExtraNote,

    admissionNumber:
      identity.importedAdmissionNumber || student?.admissionNumber || "",
    name: importedName || (student ? getStudentName(student) : "Unknown Student"),
    contact: importedPhone || student?.phone || "-",
    contactCountryCode: student?.countryCode || "",
    status:
      student?.status || (identity.rowType === "raw-import" ? "imported" : "active"),
    statusUpdatedAt:
      student?.statusUpdatedAt || student?.updatedAt || student?.createdAt || null,
    feeDueDate:
      normalizedDueDate ||
      membership?.effectiveDueDate ||
      fee?.dueDate ||
      null,
    feePaidDate: isLinkedStudent
      ? fee?.paidDate || fee?.paymentDate || formatDisplayDate(normalizedPaidDate) || null
      : formatDisplayDate(normalizedPaidDate) || fee?.paidDate || fee?.paymentDate || null,
    feePaid: formatDisplayDate(identity.importedFeePaid) || fee?.amountPaid || fee?.amount || "",
    feeStatus: isLinkedStudent
      ? fee
        ? feeStatusSummary?.code || ""
        : identity.importedFeeStatus || feeStatusSummary?.code || ""
      : identity.importedFeeStatus || fee?.status || membership?.feeStatus || "",
    feeStatusSummary: isLinkedStudent && (fee || membership?.lastAdjustedAt || !clean(identity.importedFeeStatus))
      ? feeStatusSummary
      : null,
    membership,
    attendance,
    ...counts,
  };
};

const buildMonthlyRows = async ({
  academyObjectId,
  batchObjectId,
  month,
  year,
  days,
  attendanceDocs,
  monthMetadataDocs = [],
  latestFeeValues = false,
}) => {
  const markedStudentIds = [];

  attendanceDocs.forEach((doc) => {
    (doc.records || []).forEach((record) => {
      if (record.student) markedStudentIds.push(record.student);
    });
  });

  // Fetch the current roster and historical students through index-friendly
  // queries, then merge by ID. This avoids a broad $or scan on large academies.
  const studentFields = "admissionNumber firstName lastName phone countryCode status statusUpdatedAt joiningDate createdAt updatedAt batch dob dateOfBirth fatherName schoolName address";
  const [rosterStudents, historicalStudents] = await Promise.all([
    Student.find({ academy: academyObjectId, batch: batchObjectId, status: { $in: ["active", "inactive"] } }).select(studentFields).lean(),
    markedStudentIds.length
      ? Student.find({ academy: academyObjectId, _id: { $in: [...new Set(markedStudentIds.map(String))] }, status: { $in: ["active", "inactive"] } }).select(studentFields).lean()
      : Promise.resolve([]),
  ]);
  const students = [...new Map([...rosterStudents, ...historicalStudents].map(student => [String(student._id), student])).values()];

  const studentMap = new Map(students.map((student) => [String(student._id), student]));

  const studentIds = students.map((student) => student._id);
  const [feeMap, membershipMap] = await Promise.all([
    getMonthlyFeeMap({ academyId: academyObjectId, studentIds, month, year, latest: latestFeeValues }),
    getMembershipMap({ academyId: academyObjectId, studentIds }),
  ]);

  const rowIdentityMap = new Map();
  const attendanceByRow = new Map();

  students.forEach((student) => {
    const studentId = String(student._id);
    const key = getAttendanceRegisterRowKey({ student: studentId });

    if (!rowIdentityMap.has(key)) {
      rowIdentityMap.set(key, {
        rowId: key,
        student,
        studentId,
        rowType: "student",
        importedRowNumber: null,
        importedSourceSheet: "",
        importedSerialNo: "",
        importedName: "",
        importedPhone: "",
        importedAdmissionNumber: "",
        importedDueDate: "",
        importedPaidDate: "",
        importedFeePaid: "",
        importedFeeStatus: "",
        importedExtraNote: "",
        source: "manual",
      });
    }

    if (!attendanceByRow.has(key)) {
      attendanceByRow.set(key, buildBlankAttendance(days));
    }
  });

  monthMetadataDocs.forEach((metadata) => {
    const studentId = String(metadata.student || "");
    const key = getAttendanceRegisterRowKey({ student: studentId });
    const existing = rowIdentityMap.get(key);
    if (!existing) return;
    rowIdentityMap.set(key, mergeMonthlyRecordIdentity(existing, {
      studentId,
      rowType: "student",
      source: "excel-import",
      importedRowNumber: metadata.importedRowNumber,
      importedSourceSheet: metadata.sourceSheet,
      importedDueDate: metadata.importedDueDate,
      importedPaidDate: metadata.importedPaidDate,
      importedFeePaid: metadata.importedFeePaid,
      importedFeeStatus: metadata.importedFeeStatus,
      importedExtraNote: metadata.importedExtraNote,
    }));
  });

  attendanceDocs.forEach((doc) => {
    const dateKey = getLocalDateKey(doc.date);

    (doc.records || []).forEach((record) => {
      const identity = getRecordDisplayIdentity(record, studentMap);
      const rowKey = getAttendanceRegisterRowKey({
        ...identity,
        student: identity.studentId,
      });

      if (!rowKey) return;

      const normalizedRowKey = String(rowKey);

      rowIdentityMap.set(
        normalizedRowKey,
        rowIdentityMap.has(normalizedRowKey)
          ? mergeMonthlyRecordIdentity(rowIdentityMap.get(normalizedRowKey), identity)
          : identity
      );

      if (!attendanceByRow.has(normalizedRowKey)) {
        attendanceByRow.set(normalizedRowKey, buildBlankAttendance(days));
      }

      const rowAttendance = attendanceByRow.get(normalizedRowKey);
      if (rowAttendance && dateKey) {
        rowAttendance[dateKey] = toShortStatus(record.status);
      }
    });
  });

  return {
    students,
    rows: Array.from(rowIdentityMap.entries())
      .map(([rowKey, identity], index) => {
        const attendance = attendanceByRow.get(rowKey) || buildBlankAttendance(days);
        const fee = identity.studentId ? feeMap.get(String(identity.studentId)) : null;
        const membership = identity.studentId
          ? membershipMap.get(String(identity.studentId)) || null
          : null;

        return buildRowFromRecord({
          identity,
          attendance,
          index,
          fee,
          membership,
        });
      })
      .sort((a, b) => {
        const rank = { active: 0, inactive: 1, imported: 2 };
        const rankDifference = (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
        if (rankDifference) return rankDifference;

        if (a.status === "inactive" && b.status === "inactive") {
          const aTime = new Date(a.statusUpdatedAt || 0).getTime();
          const bTime = new Date(b.statusUpdatedAt || 0).getTime();
          if (aTime !== bTime) return bTime - aTime;
        }

        return Number(a.sortOrder || 999999) - Number(b.sortOrder || 999999);
      })
      .map((row, index) => ({
        ...row,
        no: row.importedSerialNo || index + 1,
      })),
  };
};

export const getMonthlyAttendanceRegister = async ({
  academyId,
  batchId,
  month,
  year,
}) => {
  const academyObjectId = toObjectId(academyId);
  const batchObjectId = toObjectId(batchId);

  if (!academyObjectId) {
    const error = new Error("Academy is required");
    error.statusCode = 400;
    throw error;
  }

  if (!batchObjectId) {
    const error = new Error("Valid batch is required");
    error.statusCode = 400;
    throw error;
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || numericMonth < 1 || numericMonth > 12 || !numericYear) {
    const error = new Error("Valid month and year are required");
    error.statusCode = 400;
    throw error;
  }

  const startedAt = performance.now();
  const [currentYearText, currentMonthText] = todayDateKey().split("-");
  const isCurrentRegister = numericYear === Number(currentYearText) && numericMonth === Number(currentMonthText);
  const days = buildDays({ year: numericYear, month: numericMonth });
  const { start, end } = getMonthRange({ year: numericYear, month: numericMonth });
  const orderId = `${academyObjectId}:${batchObjectId}:${numericYear}:${numericMonth}`;
  const [batch, attendanceDocs, dayNoteDocs, order, monthMetadataDocs, historicalFeeContextDocs] = await Promise.all([
    Batch.findOne({ _id: batchObjectId, academy: academyObjectId }).select("batchName martialArt branch isActive").lean(),
    Attendance.find({ academy: academyObjectId, batch: batchObjectId, date: { $gte: start, $lt: end } }).select("date records").lean(),
    AttendanceDayNote.find({ academy: academyObjectId, batch: batchObjectId, date: { $gte: start, $lt: end } }).select("date type title description color createdAt updatedAt").lean(),
    AttendanceRowOrder.findById(orderId).select("keys revision").lean(),
    AttendanceMonthMetadata.find(
      isCurrentRegister
        ? {
            academy: academyObjectId,
            batch: batchObjectId,
            $or: [
              { year: { $lt: numericYear } },
              { year: numericYear, month: { $lte: numericMonth } },
            ],
          }
        : { academy: academyObjectId, batch: batchObjectId, year: numericYear, month: numericMonth }
    ).sort(isCurrentRegister ? { updatedAt: -1 } : {}).lean(),
    isCurrentRegister
      ? Attendance.find({
          academy: academyObjectId,
          batch: batchObjectId,
          date: { $lt: end },
          records: {
            $elemMatch: {
              $or: [
                { importedDueDate: { $exists: true, $nin: [null, ""] } },
                { importedPaidDate: { $exists: true, $nin: [null, ""] } },
                { importedFeePaid: { $exists: true, $nin: [null, ""] } },
                { importedFeeStatus: { $exists: true, $nin: [null, ""] } },
              ],
            },
          },
        })
          .select("date records.student records.importedDueDate records.importedPaidDate records.importedFeePaid records.importedFeeStatus")
          .sort({ date: -1, updatedAt: -1 })
          .limit(40)
          .lean()
      : Promise.resolve([]),
  ]);

  if (!batch) {
    const error = new Error("Batch not found in your academy");
    error.statusCode = 404;
    throw error;
  }

  const dayNotes = dayNoteDocs.reduce((map, note) => {
    const dateKey = new Date(note.date).toISOString().slice(0, 10);
    map[dateKey] = {
      _id: note._id,
      date: dateKey,
      type: note.type,
      title: note.title,
      description: note.description || "",
      color: note.color,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
    return map;
  }, {});

  const effectiveMonthMetadataDocs = isCurrentRegister
    ? [...historicalFeeContextDocs.reduce((map, doc) => {
        (doc.records || []).forEach((record) => {
          const studentId = String(record.student || "");
          if (!studentId) return;
          const latest = map.get(studentId) || { student: record.student };
          ["importedDueDate", "importedPaidDate", "importedFeePaid", "importedFeeStatus"].forEach((field) => {
            if (!clean(latest[field]) && clean(record[field])) latest[field] = record[field];
          });
          map.set(studentId, latest);
        });
        return map;
      }, monthMetadataDocs.reduce((map, item) => {
        const studentId = String(item.student);
        if (!map.has(studentId)) {
          map.set(studentId, { ...item });
          return map;
        }

        const latest = map.get(studentId);
        [
          "importedDueDate",
          "importedPaidDate",
          "importedFeePaid",
          "importedFeeStatus",
          "importedExtraNote",
        ].forEach((field) => {
          if (!clean(latest[field]) && clean(item[field])) latest[field] = item[field];
        });
        return map;
      }, new Map())).values()]
    : monthMetadataDocs;

  const { rows, students } = await buildMonthlyRows({
    academyObjectId,
    batchObjectId,
    month: numericMonth,
    year: numericYear,
    days,
    attendanceDocs,
    monthMetadataDocs: effectiveMonthMetadataDocs,
    latestFeeValues: isCurrentRegister,
  });

  const orderedRows = applyRowOrder(rows.map((row) => ({ ...row, registerOrderKey: getAttendanceRegisterRowKey(row) })), order?.keys || []);
  return {
    orderRevision: order?.revision || 0,
    month: numericMonth,
    year: numericYear,
    batch,
    days,
    dayNotes,
    students,
    rows: orderedRows,
    performance: { totalMs: Math.round(performance.now() - startedAt), rowCount: orderedRows.length, attendanceDocuments: attendanceDocs.length },
  };
};

export const moveMonthlyAttendanceRow = async ({ academyId, batchId, month, year, rowKey, position, orderedKeys, revision }) => {
  if (!Number.isInteger(Number(month)) || Number(month) < 1 || Number(month) > 12 || !Number.isInteger(Number(year)) || Number(year) < 2000 || Number(year) > 2100) {
    throw Object.assign(new Error("Valid month and year are required"), { statusCode: 400 });
  }
  const register = await getMonthlyAttendanceRegister({ academyId, batchId, month, year });
  if (!Number.isInteger(revision) || revision !== register.orderRevision) {
    const error = new Error("Order changed in another window. Refresh and try again.");
    error.statusCode = 409;
    throw error;
  }
  const currentKeys = register.rows.map((row) => row.registerOrderKey);
  let keys;
  if (Array.isArray(orderedKeys)) {
    const uniqueKeys = new Set(orderedKeys);
    const currentKeySet = new Set(currentKeys);
    const isExactRegister = orderedKeys.length === currentKeys.length && uniqueKeys.size === currentKeys.length && orderedKeys.every((key) => currentKeySet.has(key));
    if (!isExactRegister) throw Object.assign(new Error("Submitted attendance order does not match this register"), { statusCode: 400 });
    keys = orderedKeys;
  } else {
    keys = moveRowKeys(currentKeys, rowKey, position);
  }
  const orderId = `${academyId}:${batchId}:${Number(year)}:${Number(month)}`;
  try {
    const saved = await AttendanceRowOrder.findOneAndUpdate({ _id: orderId, revision }, {
      $set: { academy: academyId, batch: batchId, month: Number(month), year: Number(year), keys },
      $inc: { revision: 1 },
    }, { upsert: revision === 0, new: true, runValidators: true });
    if (!saved) throw Object.assign(new Error("Order changed. Refresh and try again."), { statusCode: 409 });
    return { ...register, orderRevision: saved.revision, rows: applyRowOrder(register.rows, keys) };
  } catch (error) {
    if (error.code === 11000) throw Object.assign(new Error("Order changed. Refresh and try again."), { statusCode: 409 });
    throw error;
  }
};

export const getYearlyAttendanceRegister = async ({ academyId, batchId, year }) => {
  const numericYear = Number(year);

  if (!numericYear) {
    const error = new Error("Valid year is required");
    error.statusCode = 400;
    throw error;
  }

  const months = await Promise.all(
    REGISTER_MONTHS.map(async (monthInfo) => {
      const data = await getMonthlyAttendanceRegister({
        academyId,
        batchId,
        month: monthInfo.value,
        year: numericYear,
      });

      return {
        ...monthInfo,
        ...data,
        hasAttendance: Array.isArray(data.rows)
          ? data.rows.some(
              (row) =>
                row.presentCount ||
                row.absentCount ||
                row.leaveCount ||
                row.lateCount
            )
          : false,
      };
    })
  );

  const batch = months.find((item) => item.batch)?.batch || null;

  return {
    year: numericYear,
    batch,
    months,
  };
};

export const getStudentYearlyAttendanceProfile = async ({
  academyId,
  studentId,
  year,
}) => {
  const academyObjectId = toObjectId(academyId);
  const studentObjectId = toObjectId(studentId);
  const numericYear = Number(year);

  if (!academyObjectId) {
    const error = new Error("Academy is required");
    error.statusCode = 400;
    throw error;
  }

  if (!studentObjectId) {
    const error = new Error("Valid student is required");
    error.statusCode = 400;
    throw error;
  }

  if (!numericYear) {
    const error = new Error("Valid year is required");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({
    _id: studentObjectId,
    academy: academyObjectId,
  })
    .populate("branch", "branchName address city state country isMainBranch")
    .populate("batch", "batchName martialArt")
    .lean();

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const yearStart = new Date(Date.UTC(numericYear, 0, 1));
  const yearEnd = new Date(Date.UTC(numericYear + 1, 0, 1));

  const [attendanceDocs, monthMetadataDocs] = await Promise.all([
    Attendance.find({
      academy: academyObjectId,
      date: { $gte: yearStart, $lt: yearEnd },
      "records.student": studentObjectId,
    }).populate("batch", "batchName martialArt").lean(),
    AttendanceMonthMetadata.find({ academy: academyObjectId, student: studentObjectId, year: numericYear }).lean(),
  ]);
  const relevantBatchIds = [...new Set([
    String(student.batch?._id || student.batch || ""),
    ...attendanceDocs.map((doc) => String(doc.batch?._id || doc.batch || "")),
  ].filter(Boolean))];
  const dayNoteDocs = relevantBatchIds.length
    ? await AttendanceDayNote.find({
        academy: academyObjectId,
        batch: { $in: relevantBatchIds },
        date: { $gte: yearStart, $lt: yearEnd },
      }).select("batch date type title description color").lean()
    : [];
  const monthMetadataMap = new Map(monthMetadataDocs.map((item) => [Number(item.month), item]));
  const attendanceBatchByDate = new Map(
    attendanceDocs.map((doc) => [getLocalDateKey(doc.date), String(doc.batch?._id || doc.batch || "")])
  );
  const dayNotes = dayNoteDocs.reduce((map, note) => {
    const dateKey = getLocalDateKey(note.date);
    const attendanceBatchId = attendanceBatchByDate.get(dateKey);
    if (attendanceBatchId && String(note.batch || "") !== attendanceBatchId) return map;
    if (map[dateKey]) return map;
    map[dateKey] = {
      type: note.type,
      title: note.title,
      description: note.description || "",
      color: note.color || "#e2e8f0",
    };
    return map;
  }, {});

  const firstImportedRecord =
    attendanceDocs
      .flatMap((doc) => doc.records || [])
      .find((record) => String(record.student) === String(studentObjectId) && record.source === "excel-import") ||
    null;

  const months = REGISTER_MONTHS.map((monthInfo) => {
    const days = buildDays({ year: numericYear, month: monthInfo.value });
    const attendance = {};

    days.forEach((day) => {
      attendance[day.dateKey] = "";
    });

    const monthDocs = attendanceDocs.filter((doc) => {
      const date = new Date(doc.date);
      return date.getUTCMonth() + 1 === monthInfo.value;
    });

    const monthMetadata = monthMetadataMap.get(monthInfo.value);
    let importedDueDate = clean(monthMetadata?.importedDueDate);
    let importedPaidDate = clean(monthMetadata?.importedPaidDate);
    let importedFeePaid = clean(monthMetadata?.importedFeePaid);
    let importedFeeStatus = clean(monthMetadata?.importedFeeStatus);

    monthDocs.forEach((doc) => {
      const dateKey = getLocalDateKey(doc.date);
      const record = (doc.records || []).find(
        (item) => String(item.student) === String(studentObjectId)
      );

      if (!record) return;

      attendance[dateKey] = toShortStatus(record.status);

      if (!importedDueDate && record.importedDueDate) {
        importedDueDate = clean(record.importedDueDate);
      }

      if (!importedPaidDate && record.importedPaidDate) {
        importedPaidDate = clean(record.importedPaidDate);
      }

      if (!importedFeePaid && record.importedFeePaid) {
        importedFeePaid = formatDisplayDate(record.importedFeePaid);
      }

      if (!importedFeeStatus && record.importedFeeStatus) {
        importedFeeStatus = record.importedFeeStatus;
      }
    });

    return {
      ...monthInfo,
      days,
      attendance,
      importedPaidDate,
      importedDueDate,
      importedFeePaid,
      importedFeeStatus,
      ...calculateCounts(attendance),
    };
  });

  const [businessYear, businessMonth] = todayDateKey().split("-").map(Number);
  if (numericYear === businessYear) {
    const currentMonth = businessMonth;
    const currentMonthRow = months.find((item) => Number(item.value) === currentMonth);
    if (currentMonthRow) {
      const latestNonEmpty = [...monthMetadataDocs]
        .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0))
        .reduce((result, item) => {
          [
            "importedDueDate",
            "importedPaidDate",
            "importedFeePaid",
            "importedFeeStatus",
          ].forEach((field) => {
            if (!clean(result[field]) && clean(item[field])) result[field] = item[field];
          });
          return result;
        }, {});

      // Older imports can keep fee context on attendance records without a
      // matching AttendanceMonthMetadata document. The month rows above have
      // already normalised both sources, so use the most recent prior row as a
      // second fallback for each still-empty current-month field.
      const latestPriorMonthValues = months
        .filter((item) => Number(item.value) < currentMonth)
        .sort((left, right) => Number(right.value) - Number(left.value))
        .reduce((result, item) => {
          [
            "importedDueDate",
            "importedPaidDate",
            "importedFeePaid",
            "importedFeeStatus",
          ].forEach((field) => {
            if (!clean(result[field]) && clean(item[field])) result[field] = item[field];
          });
          return result;
        }, {});

      [
        "importedDueDate",
        "importedPaidDate",
        "importedFeePaid",
        "importedFeeStatus",
      ].forEach((field) => {
        const fallbackValue = clean(latestNonEmpty[field]) || clean(latestPriorMonthValues[field]);
        if (!clean(currentMonthRow[field]) && fallbackValue) {
          currentMonthRow[field] = fallbackValue;
        }
      });
    }
  }

  return {
    year: numericYear,
    student: {
      _id: student._id,
      name: getStudentName(student),
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      admissionNumber: student.admissionNumber || "",
      profilePhoto: student.profilePhoto || "",
      status: student.status || "active",
      age: student.age ?? null,
      ageCategory: student.ageCategory || "",
      phone: student.phone || "",
      contact: firstImportedRecord?.importedPhone || student.phone || "",
      branch: student.branch || null,
      batch: student.batch || null,
      dob: student.dob || student.dateOfBirth || null,
      fatherName: student.fatherName || "",
      schoolName: student.schoolName || "",
      address: student.address || "",
      joiningDate: student.joiningDate || student.createdAt || null,
      importedName: firstImportedRecord?.importedName || "",
      importedPhone: firstImportedRecord?.importedPhone || "",
      importedPaidDate: firstImportedRecord?.importedPaidDate || "",
      importedFeePaid: firstImportedRecord?.importedFeePaid || "",
      importedFeeStatus: firstImportedRecord?.importedFeeStatus || "",
    },
    months,
    dayNotes,
  };
};

export const saveMonthlyAttendanceRegister = async ({
  academyId,
  batchId,
  month,
  year,
  rows = [],
  userId,
}) => {
  const academyObjectId = toObjectId(academyId);
  const batchObjectId = toObjectId(batchId);

  if (!academyObjectId) {
    const error = new Error("Academy is required");
    error.statusCode = 400;
    throw error;
  }

  if (!batchObjectId) {
    const error = new Error("Valid batch is required");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(rows)) {
    const error = new Error("Rows must be an array");
    error.statusCode = 400;
    throw error;
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || numericMonth < 1 || numericMonth > 12 || !numericYear) {
    const error = new Error("Valid month and year are required");
    error.statusCode = 400;
    throw error;
  }

  const days = buildDays({ year: numericYear, month: numericMonth });

  const batch = await Batch.findOne({
    _id: batchObjectId,
    academy: academyObjectId,
  }).select("_id");

  if (!batch) {
    const error = new Error("Batch not found in your academy");
    error.statusCode = 404;
    throw error;
  }

  const studentIds = rows
    .filter((row) => row.rowType !== "raw-import")
    .map((row) => row.studentId)
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

  const validStudents = await Student.find({
    _id: { $in: studentIds },
    academy: academyObjectId,
  }).select("_id");

  const validStudentIds = new Set(validStudents.map((item) => String(item._id)));

  const recordsByDate = new Map();
  const expectedCells = new Map();

  days.forEach((day) => {
    recordsByDate.set(day.dateKey, new Map());
  });

  rows.forEach((row) => {
    const isRawImport = row.rowType === "raw-import";
    const studentId = String(row.studentId || "");

    if (!isRawImport && !validStudentIds.has(studentId)) return;
    const rowKey = getAttendanceRegisterRowKey({
      ...row,
      student: isRawImport ? null : studentId,
    });

    days.forEach((day) => {
      const shortStatus = normalizeShortStatus(row.attendance?.[day.dateKey]);
      const longStatus = toLongStatus(shortStatus);

      if (!longStatus) return;

      const record = {
        student: isRawImport ? null : studentId,
        importedRowNumber: row.importedRowNumber || null,
        importedSourceSheet: clean(row.importedSourceSheet),
        importedSerialNo: clean(row.importedSerialNo || row.no),
        importedName: clean(row.importedName || row.name),
        importedPhone: normalizePhone(row.importedPhone || row.contact),
        importedAdmissionNumber: clean(row.importedAdmissionNumber),
        importedDueDate: clean(row.importedDueDate || row.feeDueDate),
        importedPaidDate: clean(row.importedPaidDate || row.feePaidDate),
        importedFeePaid: clean(row.importedFeePaid || row.feePaid),
        importedFeeStatus: clean(row.importedFeeStatus || row.feeStatus),
        importedExtraNote: clean(row.importedExtraNote),
        status: longStatus,
        source: row.source === "excel-import" ? "excel-import" : "manual",
        note:
          row.source === "excel-import"
            ? "Saved from monthly register imported row"
            : "",
      };

      // A register cell is uniquely identified by row + date. Imported data
      // can contain duplicate rows; persisting a Map prevents duplicate
      // records from being reconstructed as missing/merged attendance later.
      recordsByDate.get(day.dateKey).set(rowKey, record);
      expectedCells.set(`${day.dateKey}::${rowKey}`, shortStatus);
    });
  });

  const operations = [];

  for (const [dateKey, recordsMap] of recordsByDate.entries()) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const records = Array.from(recordsMap.values());

    operations.push(
      Attendance.findOneAndUpdate(
        {
          academy: academyObjectId,
          batch: batchObjectId,
          date,
        },
        {
          $set: {
            records,
            updatedBy: userId,
          },
          $setOnInsert: {
            academy: academyObjectId,
            batch: batchObjectId,
            date,
            markedBy: userId,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      )
    );
  }

  await Promise.all(operations);

  const savedRegister = await getMonthlyAttendanceRegister({
    academyId: academyObjectId,
    batchId: batchObjectId,
    month: numericMonth,
    year: numericYear,
  });

  const persistedCells = new Map();
  savedRegister.rows.forEach((row) => {
    const rowKey = getAttendanceRegisterRowKey(row);
    days.forEach((day) => {
      const status = normalizeShortStatus(row.attendance?.[day.dateKey]);
      if (status) persistedCells.set(`${day.dateKey}::${rowKey}`, status);
    });
  });

  const failedCells = Array.from(expectedCells.entries()).filter(
    ([cellKey, status]) => persistedCells.get(cellKey) !== status
  );
  const unexpectedCells = Array.from(persistedCells.keys()).filter(
    (cellKey) => !expectedCells.has(cellKey)
  );

  if (failedCells.length || unexpectedCells.length) {
    const error = new Error(
      `Attendance save verification failed (${expectedCells.size - failedCells.length}/${expectedCells.size} marks persisted)`
    );
    error.statusCode = 500;
    throw error;
  }

  return {
    ...savedRegister,
    saveVerification: {
      verified: true,
      persistedMarks: expectedCells.size,
    },
  };
};
