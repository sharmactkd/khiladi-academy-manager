import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePayment from "../models/FeePayment.js";
import AttendanceDayNote from "../models/AttendanceDayNote.js";
import AttendanceRowOrder from "../models/AttendanceRowOrder.js";
import AttendanceMonthMetadata from "../models/AttendanceMonthMetadata.js";
import MembershipAdjustment from "../models/MembershipAdjustment.js";
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

const normalizeStudentState = (value, fallback = "active") => {
  const state = clean(value).toLowerCase();
  return ["active", "inactive", "imported"].includes(state) ? state : fallback;
};

export const resolveMonthlyStudentStatus = ({
  currentStatus,
  statusUpdatedAt,
  monthEnd,
  storedStatus,
  isCurrentRegister = false,
}) => {
  const current = normalizeStudentState(currentStatus);
  if (isCurrentRegister) return current;
  if (storedStatus) return normalizeStudentState(storedStatus, current);

  const changedAt = new Date(statusUpdatedAt || 0);
  const end = new Date(monthEnd || 0);
  if (
    ["active", "inactive"].includes(current) &&
    Number.isFinite(changedAt.getTime()) &&
    Number.isFinite(end.getTime()) &&
    changedAt >= end
  ) {
    return current === "active" ? "inactive" : "active";
  }
  return current;
};

const asStatusObject = (value) => {
  if (!value) return {};
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.filter((item) => item?.key).map((item) => [String(item.key), item.status])
    );
  }
  if (value instanceof Map) return Object.fromEntries(value);
  return typeof value === "object" ? value : {};
};

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

export const hasMarkedAttendanceCounts = (month = {}) =>
  Number(month.presentCount || 0) + Number(month.absentCount || 0) +
  Number(month.leaveCount || 0) + Number(month.lateCount || 0) > 0;

export const applyCurrentMembershipFeeStatus = ({ months = [], membership = null, todayKey = todayDateKey() } = {}) => {
  const [year, month] = String(todayKey || "").split("-").map(Number);
  const liveLabel = membership?.feeStatusCleared === true
    ? "-"
    : clean(membership?.feeStatusSummary?.label);
  if (!year || !month || !liveLabel) return months;

  return months.map((item) => Number(item.year) === year && Number(item.value) === month
    ? { ...item, displayFeeStatus: liveLabel }
    : item);
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

  const payments = latest
    ? await FeePayment.aggregate([
        { $match: query },
        { $sort: { student: 1, paymentDate: -1, createdAt: -1 } },
        { $group: { _id: "$student", payment: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$payment" } },
      ])
    : await FeePayment.find(query)
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean();

  const map = new Map();

  payments.forEach((payment) => {
    const key = String(payment.student);
    if (!map.has(key)) map.set(key, payment);
  });

  return map;
};

const serializeHistoricalMembership = (adjustment) => {
  const state = adjustment?.nextState;
  if (!state) return null;
  const feeStatusSummary = state.feeStatusCleared === true ? null : resolveFeeStatus({
    membership: state,
    fallbackStatus: state.feeStatus || "due",
  });
  return {
    status: state.status || "active",
    effectiveDueDate: state.dueDateCleared === true ? null : state.effectiveDueDate || state.nextDueDate || null,
    nextDueDate: state.dueDateCleared === true ? null : state.nextDueDate || state.effectiveDueDate || null,
    dueDateCleared: state.dueDateCleared === true,
    remainingTrainingDays: Number(state.remainingTrainingDays || 0),
    unpaidMonths: Number(state.unpaidMonths || 0),
    unpaidDays: Number(state.unpaidDays || 0),
    feeRequired: state.feeRequired !== false,
    feeStatus: state.feeStatusCleared === true ? "" : feeStatusSummary?.code || state.feeStatus || "",
    feeStatusSummary,
    feeStatusCleared: state.feeStatusCleared === true,
    internalNote: state.internalNote || "",
    lastAdjustedAt: adjustment.createdAt || null,
    historicalSnapshot: true,
  };
};

const getHistoricalMembershipMap = async ({ academyId, studentIds, monthEnd }) => {
  if (!studentIds.length) return new Map();
  const adjustments = await MembershipAdjustment.aggregate([
    { $match: { academy: academyId, student: { $in: studentIds }, createdAt: { $lt: monthEnd } } },
    { $sort: { student: 1, createdAt: -1 } },
    { $group: { _id: "$student", adjustment: { $first: "$$ROOT" } } },
  ]);
  return new Map(adjustments.map((item) => [
    String(item._id),
    serializeHistoricalMembership(item.adjustment),
  ]));
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
    studentStatus: record.studentStatus || "",
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
  if (!merged.studentStatus && incoming.studentStatus) merged.studentStatus = incoming.studentStatus;

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

export const buildRowFromRecord = ({ identity, attendance, index, fee, membership, historical = false }) => {
  const student = identity.student;
  const counts = calculateCounts(attendance);

  const importedName = clean(identity.importedName);
  const importedPhone = clean(identity.importedPhone);
  const normalizedDueDate = clean(identity.importedDueDate);
  const normalizedPaidDate = clean(identity.importedPaidDate);
  const isLinkedStudent = identity.rowType === "student" && Boolean(identity.studentId);
  const hasFeeTruth = Boolean(membership || fee || clean(identity.importedFeeStatus));
  const feeStatusSummary = hasFeeTruth && membership?.feeStatusCleared !== true ? resolveFeeStatus({
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
    importedFeePaid: identity.importedFeePaid || "",
    importedFeeStatus: identity.importedFeeStatus,
    importedExtraNote: identity.importedExtraNote,

    admissionNumber:
      identity.importedAdmissionNumber || student?.admissionNumber || "",
    name: importedName || (student ? getStudentName(student) : "Unknown Student"),
    contact: importedPhone || student?.phone || "-",
    contactCountryCode: student?.countryCode || "",
    status:
      historical && identity.studentStatus
        ? identity.studentStatus
        : student?.status || (identity.rowType === "raw-import" ? "imported" : "active"),
    statusUpdatedAt:
      student?.statusUpdatedAt || student?.updatedAt || student?.createdAt || null,
    feeDueDate:
      normalizedDueDate ||
      fee?.dueDate ||
      membership?.effectiveDueDate ||
      null,
    feePaidDate: isLinkedStudent
      ? fee?.paidDate || fee?.paymentDate || formatDisplayDate(normalizedPaidDate) || null
      : formatDisplayDate(normalizedPaidDate) || fee?.paidDate || fee?.paymentDate || null,
    feePaid: formatDisplayDate(identity.importedFeePaid) || fee?.amountPaid || fee?.amount || "",
    feeStatus: membership?.feeStatusCleared === true
      ? ""
      : isLinkedStudent
      ? fee
        ? feeStatusSummary?.code || ""
        : identity.importedFeeStatus || feeStatusSummary?.code || ""
      : identity.importedFeeStatus || fee?.status || membership?.feeStatus || "",
    feeStatusSummary: membership?.feeStatusCleared === true
      ? null
      : isLinkedStudent && (fee || membership?.lastAdjustedAt || !clean(identity.importedFeeStatus))
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
  isCurrentRegister = false,
  monthEnd,
}) => {
  const markedStudentIds = [];

  attendanceDocs.forEach((doc) => {
    (doc.records || []).forEach((record) => {
      if (record.student) markedStudentIds.push(record.student);
    });
  });

  // Fetch the current roster and historical students through index-friendly
  // queries, then merge by ID. This avoids a broad $or scan on large academies.
  const metadataStudentIds = monthMetadataDocs.map((item) => item.student).filter(Boolean);
  const historicalIdentityIds = [...new Set([...markedStudentIds, ...metadataStudentIds].map(String))];
  const studentFields = "admissionNumber firstName lastName phone countryCode status statusUpdatedAt joiningDate createdAt updatedAt batch dob dateOfBirth fatherName schoolName address";
  const [rosterStudents, historicalStudents] = await Promise.all([
    isCurrentRegister
      ? Student.find({ academy: academyObjectId, batch: batchObjectId, status: { $in: ["active", "inactive"] } }).select(studentFields).lean()
      : Promise.resolve([]),
    historicalIdentityIds.length
      ? Student.find({ academy: academyObjectId, _id: { $in: historicalIdentityIds } }).select(studentFields).lean()
      : Promise.resolve([]),
  ]);
  const students = [...new Map([...rosterStudents, ...historicalStudents].map(student => [String(student._id), student])).values()];

  const studentMap = new Map(students.map((student) => [String(student._id), student]));

  const studentIds = students.map((student) => student._id);
  const [feeMap, membershipMap] = await Promise.all([
    getMonthlyFeeMap({ academyId: academyObjectId, studentIds, month, year, latest: latestFeeValues }),
    isCurrentRegister
      ? getMembershipMap({ academyId: academyObjectId, studentIds })
      : getHistoricalMembershipMap({ academyId: academyObjectId, studentIds, monthEnd }),
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
          historical: !isCurrentRegister,
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
  const metadataScope = isCurrentRegister
    ? {
        academy: academyObjectId,
        batch: batchObjectId,
        $or: [
          { year: { $lt: numericYear } },
          { year: numericYear, month: { $lte: numericMonth } },
        ],
      }
    : { academy: academyObjectId, batch: batchObjectId, year: numericYear, month: numericMonth };
  const latestMetadataFacet = (field) => [
    { $match: { [field]: { $exists: true, $nin: [null, ""] } } },
    { $sort: { updatedAt: -1 } },
    { $group: { _id: "$student", student: { $first: "$student" }, [field]: { $first: `$${field}` } } },
    { $project: { _id: 0, student: 1, [field]: 1 } },
  ];
  const metadataQuery = isCurrentRegister
    ? AttendanceMonthMetadata.aggregate([
        { $match: metadataScope },
        { $facet: {
          importedDueDate: latestMetadataFacet("importedDueDate"),
          importedPaidDate: latestMetadataFacet("importedPaidDate"),
          importedFeePaid: latestMetadataFacet("importedFeePaid"),
          importedFeeStatus: latestMetadataFacet("importedFeeStatus"),
          importedExtraNote: latestMetadataFacet("importedExtraNote"),
        } },
      ])
    : AttendanceMonthMetadata.find(metadataScope).lean();
  const [batch, attendanceDocs, dayNoteDocs, order, rawMonthMetadataDocs, historicalFeeContextDocs] = await Promise.all([
    Batch.findOne({ _id: batchObjectId, academy: academyObjectId }).select("batchName martialArt branch isActive").lean(),
    Attendance.find({ academy: academyObjectId, batch: batchObjectId, date: { $gte: start, $lt: end } }).select("date records").lean(),
    AttendanceDayNote.find({ academy: academyObjectId, batch: batchObjectId, date: { $gte: start, $lt: end } }).select("date type title description color createdAt updatedAt").lean(),
    AttendanceRowOrder.findById(orderId).select("keys statuses snapshotSource revision").lean(),
    metadataQuery,
    isCurrentRegister
      ? Attendance.aggregate([
          { $match: {
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
        } },
          { $sort: { date: -1, updatedAt: -1 } },
          { $limit: 40 },
          { $unwind: "$records" },
          { $match: {
            $or: [
              { "records.importedDueDate": { $exists: true, $nin: [null, ""] } },
              { "records.importedPaidDate": { $exists: true, $nin: [null, ""] } },
              { "records.importedFeePaid": { $exists: true, $nin: [null, ""] } },
              { "records.importedFeeStatus": { $exists: true, $nin: [null, ""] } },
            ],
          } },
          { $project: {
            _id: 0,
            date: 1,
            student: "$records.student",
            importedDueDate: "$records.importedDueDate",
            importedPaidDate: "$records.importedPaidDate",
            importedFeePaid: "$records.importedFeePaid",
            importedFeeStatus: "$records.importedFeeStatus",
          } },
        ])
      : Promise.resolve([]),
  ]);

  if (!batch) {
    const error = new Error("Batch not found in your academy");
    error.statusCode = 404;
    throw error;
  }

  // Current attendance only needs the newest non-empty value of each imported
  // fee field per student. Resolve that inside MongoDB instead of transferring
  // every historical metadata document to Node.
  const monthMetadataDocs = isCurrentRegister
    ? Object.values(rawMonthMetadataDocs?.[0] || {}).flat()
    : rawMonthMetadataDocs;

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
      ? [...historicalFeeContextDocs.reduce((map, record) => {
          const studentId = String(record.student || "");
          if (!studentId) return map;
          const latest = map.get(studentId) || { student: record.student };
          ["importedDueDate", "importedPaidDate", "importedFeePaid", "importedFeeStatus"].forEach((field) => {
            if (!clean(latest[field]) && clean(record[field])) latest[field] = record[field];
          });
          map.set(studentId, latest);
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
    isCurrentRegister,
    monthEnd: end,
  });

  // Ignore status arrays created by the withdrawn read-time snapshot build.
  // Only an explicit attendance save is authoritative.
  const storedStatuses = order?.snapshotSource === "explicit-save"
    ? asStatusObject(order?.statuses)
    : {};
  const withdrawnReadSnapshot = order?.snapshotSource !== "explicit-save" &&
    Array.isArray(order?.statuses) && order.statuses.length > 0;
  const rowsWithMonthlyState = rows.map((row) => {
    const registerOrderKey = getAttendanceRegisterRowKey(row);
    return {
      ...row,
      registerOrderKey,
      status: resolveMonthlyStudentStatus({
        currentStatus: row.status,
        statusUpdatedAt: row.statusUpdatedAt,
        monthEnd: end,
        storedStatus: storedStatuses[registerOrderKey],
        isCurrentRegister,
      }),
    };
  });

  // GET is strictly read-only. Month order/status snapshots are persisted only
  // by an explicit attendance save or row move.
  const initialKeys = rowsWithMonthlyState.map((row) => row.registerOrderKey);
  const orderedRows = applyRowOrder(
    rowsWithMonthlyState,
    !withdrawnReadSnapshot && order?.keys?.length ? order.keys : initialKeys
  );
  return {
    orderRevision: withdrawnReadSnapshot ? 0 : order?.revision || 0,
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

  const [attendanceDocs, monthMetadataDocs, membershipMap] = await Promise.all([
    Attendance.find({
      academy: academyObjectId,
      date: { $gte: yearStart, $lt: yearEnd },
      "records.student": studentObjectId,
    }).populate("batch", "batchName martialArt").lean(),
    AttendanceMonthMetadata.find({ academy: academyObjectId, student: studentObjectId, year: numericYear }).lean(),
    getMembershipMap({ academyId: academyObjectId, studentIds: [studentObjectId] }),
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

  let months = REGISTER_MONTHS.map((monthInfo) => {
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

  months = applyCurrentMembershipFeeStatus({
    months: months.map((item) => ({ ...item, year: numericYear })),
    membership: membershipMap.get(String(studentObjectId)),
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

export const getStudentAttendanceTimeline = async ({
  academyId,
  studentId,
  offset = 0,
  limit = 12,
}) => {
  const academyObjectId = toObjectId(academyId);
  const studentObjectId = toObjectId(studentId);
  if (!academyObjectId || !studentObjectId) {
    const error = new Error("Valid academy and student are required");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ _id: studentObjectId, academy: academyObjectId })
    .populate("branch", "branchName address city state country isMainBranch")
    .populate("batch", "batchName martialArt")
    .lean();
  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const attendanceDocs = await Attendance.find({
    academy: academyObjectId,
    "records.student": studentObjectId,
  }).select({
    date: 1,
    batch: 1,
    records: { $elemMatch: { student: studentObjectId } },
  }).sort({ date: 1 }).populate("batch", "batchName martialArt").lean();

  const markedDocs = attendanceDocs.filter((doc) =>
    (doc.records || []).some((record) =>
      String(record.student) === String(studentObjectId) && Boolean(toShortStatus(record.status))
    )
  );
  const firstImportedRecord = markedDocs
    .flatMap((doc) => doc.records || [])
    .find((record) => String(record.student) === String(studentObjectId) && record.source === "excel-import") || null;
  const studentPayload = {
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
  };

  if (!markedDocs.length) {
    return { timeline: true, student: studentPayload, months: [], dayNotes: {}, pagination: { offset: 0, limit: Number(limit), total: 0, hasMore: false } };
  }

  const monthKeys = [...new Set(markedDocs.map((doc) => {
    const date = new Date(doc.date);
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
  }))];
  const years = [...new Set(monthKeys.map((key) => Number(key.split("-")[0])))];
  const [metadataDocs, membershipMap] = await Promise.all([
    AttendanceMonthMetadata.find({
      academy: academyObjectId,
      student: studentObjectId,
      year: { $in: years },
    }).lean(),
    getMembershipMap({ academyId: academyObjectId, studentIds: [studentObjectId] }),
  ]);
  const metadataMap = new Map(metadataDocs.map((item) => [`${item.year}-${item.month}`, item]));
  const groupedDocs = markedDocs.reduce((map, doc) => {
    const date = new Date(doc.date);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(doc);
    return map;
  }, new Map());

  const months = applyCurrentMembershipFeeStatus({
    months: monthKeys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    const monthInfo = REGISTER_MONTHS[month - 1];
    const days = buildDays({ year, month });
    const attendance = Object.fromEntries(days.map((day) => [day.dateKey, ""]));
    const metadata = metadataMap.get(key);
    let importedDueDate = clean(metadata?.importedDueDate);
    let importedPaidDate = clean(metadata?.importedPaidDate);
    let importedFeePaid = clean(metadata?.importedFeePaid);
    let importedFeeStatus = clean(metadata?.importedFeeStatus);
    (groupedDocs.get(key) || []).forEach((doc) => {
      const record = (doc.records || []).find((item) => String(item.student) === String(studentObjectId));
      if (!record) return;
      attendance[getLocalDateKey(doc.date)] = toShortStatus(record.status);
      if (!importedDueDate && record.importedDueDate) importedDueDate = clean(record.importedDueDate);
      if (!importedPaidDate && record.importedPaidDate) importedPaidDate = clean(record.importedPaidDate);
      if (!importedFeePaid && record.importedFeePaid) importedFeePaid = formatDisplayDate(record.importedFeePaid);
      if (!importedFeeStatus && record.importedFeeStatus) importedFeeStatus = clean(record.importedFeeStatus);
    });
    return {
      ...monthInfo,
      year,
      fullLabel: `${monthInfo.fullLabel} ${year}`,
      days,
      attendance,
      importedDueDate,
      importedPaidDate,
      importedFeePaid,
      importedFeeStatus,
      ...calculateCounts(attendance),
    };
    }).filter(hasMarkedAttendanceCounts),
    membership: membershipMap.get(String(studentObjectId)),
  });

  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeLimit = Math.min(240, Math.max(1, Number(limit) || 12));
  const visibleMonths = months.slice(safeOffset, safeOffset + safeLimit);
  const visibleDateKeys = new Set(visibleMonths.flatMap((month) => month.days.map((day) => day.dateKey)));
  const relevantBatchIds = [...new Set(markedDocs.map((doc) => String(doc.batch?._id || doc.batch || "")).filter(Boolean))];
  const firstDate = visibleMonths[0]?.days?.[0]?.dateKey;
  const lastMonth = visibleMonths.at(-1);
  const lastDate = lastMonth?.days?.at(-1)?.dateKey;
  const noteDocs = firstDate && lastDate && relevantBatchIds.length ? await AttendanceDayNote.find({
    academy: academyObjectId,
    batch: { $in: relevantBatchIds },
    date: { $gte: new Date(`${firstDate}T00:00:00.000Z`), $lte: new Date(`${lastDate}T23:59:59.999Z`) },
  }).select("date type title description color").lean() : [];
  const dayNotes = noteDocs.reduce((map, note) => {
    const dateKey = getLocalDateKey(note.date);
    if (visibleDateKeys.has(dateKey) && !map[dateKey]) map[dateKey] = { type: note.type, title: note.title, description: note.description || "", color: note.color || "#e2e8f0" };
    return map;
  }, {});

  return {
    timeline: true,
    student: studentPayload,
    months: visibleMonths,
    dayNotes,
    availableYears: years.sort((a, b) => a - b),
    pagination: { offset: safeOffset, limit: safeLimit, total: months.length, hasMore: safeOffset + safeLimit < months.length },
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

  const { start: saveMonthStart, end: saveMonthEnd } = getMonthRange({ year: numericYear, month: numericMonth });
  const [validStudents, exactMetadataDocs, existingAttendanceDocs] = await Promise.all([
    Student.find({
      _id: { $in: studentIds },
      academy: academyObjectId,
    }).select("_id"),
    AttendanceMonthMetadata.find({
      academy: academyObjectId,
      batch: batchObjectId,
      year: numericYear,
      month: numericMonth,
      student: { $in: studentIds },
    }).lean(),
    Attendance.find({
      academy: academyObjectId,
      batch: batchObjectId,
      date: { $gte: saveMonthStart, $lt: saveMonthEnd },
    }).select("records").lean(),
  ]);

  const validStudentIds = new Set(validStudents.map((item) => String(item._id)));
  const financialFields = ["importedDueDate", "importedPaidDate", "importedFeePaid", "importedFeeStatus"];
  const authoritativeMetadata = new Map(exactMetadataDocs.map((item) => [String(item.student), item]));
  existingAttendanceDocs.forEach((document) => {
    (document.records || []).forEach((record) => {
      if (!record.student) return;
      const key = String(record.student);
      const existing = authoritativeMetadata.get(key) || {};
      const merged = { ...existing };
      financialFields.forEach((field) => {
        if (!clean(merged[field]) && clean(record[field])) merged[field] = record[field];
      });
      authoritativeMetadata.set(key, merged);
    });
  });

  const recordsByDate = new Map();
  const expectedCells = new Map();
  const expectedMetadata = new Map();

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
    const financialMetadata = isRawImport ? row : authoritativeMetadata.get(studentId) || {};

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
        // Attendance saves must never convert live fee/membership display
        // values into historical imported metadata.
        importedDueDate: clean(financialMetadata.importedDueDate),
        importedPaidDate: clean(financialMetadata.importedPaidDate),
        importedFeePaid: clean(financialMetadata.importedFeePaid),
        importedFeeStatus: clean(financialMetadata.importedFeeStatus),
        importedExtraNote: clean(row.importedExtraNote),
        studentStatus: isRawImport ? "" : normalizeStudentState(row.status),
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
      if (!expectedMetadata.has(rowKey)) {
        expectedMetadata.set(rowKey, {
          importedDueDate: record.importedDueDate,
          importedPaidDate: record.importedPaidDate,
          importedFeePaid: record.importedFeePaid,
          importedFeeStatus: record.importedFeeStatus,
        });
      }
    });
  });

  const operations = [];

  for (const [dateKey, recordsMap] of recordsByDate.entries()) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const records = Array.from(recordsMap.values());

    operations.push({
      updateOne: {
        filter: {
          academy: academyObjectId,
          batch: batchObjectId,
          date,
        },
        update: {
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
        upsert: true,
      },
    });
  }

  const orderId = `${academyObjectId}:${batchObjectId}:${numericYear}:${numericMonth}`;
  const submittedRows = rows.map((row) => ({
    key: getAttendanceRegisterRowKey({
      ...row,
      student: row.rowType === "raw-import" ? null : row.studentId,
    }),
    status: normalizeStudentState(row.status, row.rowType === "raw-import" ? "imported" : "active"),
  })).filter((item) => item.key);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (operations.length) {
        await Attendance.bulkWrite(operations, { session, ordered: true });
      }
      const existingOrder = await AttendanceRowOrder.findById(orderId).session(session).lean();
      if (!existingOrder) {
        await AttendanceRowOrder.create([{
          _id: orderId,
          academy: academyObjectId,
          batch: batchObjectId,
          month: numericMonth,
          year: numericYear,
          keys: submittedRows.map((item) => item.key),
          statuses: submittedRows,
          snapshotSource: "explicit-save",
          revision: 1,
        }], { session });
      } else {
        const submittedKeySet = new Set(submittedRows.map((item) => item.key));
        const existingWasWithdrawnReadSnapshot = existingOrder.snapshotSource !== "explicit-save" &&
          Array.isArray(existingOrder.statuses) && existingOrder.statuses.length > 0;
        const baseKeys = existingWasWithdrawnReadSnapshot ? [] : existingOrder.keys || [];
        const keys = [
          ...baseKeys.filter((key) => submittedKeySet.has(key)),
          ...submittedRows.map((item) => item.key).filter((key) => !baseKeys.includes(key)),
        ];
        const keysChanged = JSON.stringify(keys) !== JSON.stringify(existingOrder.keys || []);
        await AttendanceRowOrder.updateOne(
          { _id: orderId },
          {
            $set: { keys, statuses: submittedRows, snapshotSource: "explicit-save" },
            ...(keysChanged ? { $inc: { revision: 1 } } : {}),
          },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }

  const savedRegister = await getMonthlyAttendanceRegister({
    academyId: academyObjectId,
    batchId: batchObjectId,
    month: numericMonth,
    year: numericYear,
  });

  const persistedCells = new Map();
  const persistedMetadata = new Map();
  savedRegister.rows.forEach((row) => {
    const rowKey = getAttendanceRegisterRowKey(row);
    persistedMetadata.set(rowKey, {
      importedDueDate: clean(row.importedDueDate),
      importedPaidDate: clean(row.importedPaidDate),
      importedFeePaid: clean(row.importedFeePaid),
      importedFeeStatus: clean(row.importedFeeStatus),
    });
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
  const failedMetadata = Array.from(expectedMetadata.entries()).filter(([rowKey, expected]) => {
    const actual = persistedMetadata.get(rowKey);
    return !actual || Object.keys(expected).some((field) => clean(actual[field]) !== clean(expected[field]));
  });

  if (failedCells.length || unexpectedCells.length || failedMetadata.length) {
    const error = new Error(
      `Attendance save verification failed (${expectedCells.size - failedCells.length}/${expectedCells.size} marks, ${expectedMetadata.size - failedMetadata.length}/${expectedMetadata.size} metadata rows persisted)`
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
