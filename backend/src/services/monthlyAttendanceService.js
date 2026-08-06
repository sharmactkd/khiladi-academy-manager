import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePayment from "../models/FeePayment.js";
import AttendanceDayNote from "../models/AttendanceDayNote.js";

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

const formatDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

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
    return `${pad(dd)}-${pad(mm)}-${String(yy).slice(-2)}`;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dash) {
    const [, dd, mm, yy] = dash;
    return `${pad(dd)}-${pad(mm)}-${String(yy).slice(-2)}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${String(
      date.getFullYear()
    ).slice(-2)}`;
  }

  return raw;
};

const getMonthRange = ({ year, month }) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  const start = new Date(numericYear, numericMonth - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(numericYear, numericMonth, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const buildDays = ({ year, month }) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const lastDay = new Date(numericYear, numericMonth, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = new Date(numericYear, numericMonth - 1, day);
    const dateKey = `${numericYear}-${pad(numericMonth)}-${pad(day)}`;

    return {
      day,
      dateKey,
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      isSunday: date.getDay() === 0,
      isSaturday: date.getDay() === 6,
      isToday: new Date().toISOString().slice(0, 10) === dateKey,
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

const getLatestFeeMap = async ({ academyId, studentIds }) => {
  if (!studentIds.length) return new Map();

  const payments = await FeePayment.find({
    academy: academyId,
    student: { $in: studentIds },
  })
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
    rowId:
      record.importedRowNumber ||
      record.importedPhone ||
      record.importedName ||
      record.student ||
      `${Date.now()}-${Math.random()}`,
    student,
    studentId: record.student ? String(record.student) : "",
    rowType: record.student ? "student" : "raw-import",
    importedRowNumber: record.importedRowNumber || null,
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

const buildRowFromRecord = ({ identity, attendance, index, fee }) => {
  const student = identity.student;
  const counts = calculateCounts(attendance);

  const importedName = clean(identity.importedName);
  const importedPhone = clean(identity.importedPhone);
  const hasExplicitDueDate = Boolean(clean(identity.importedDueDate));
  const normalizedDueDate = hasExplicitDueDate
    ? clean(identity.importedDueDate)
    : clean(identity.importedPaidDate);
  const normalizedPaidDate = hasExplicitDueDate
    ? clean(identity.importedPaidDate)
    : clean(identity.importedFeePaid);

  return {
    no: identity.importedSerialNo || index + 1,
    sortOrder: Number(identity.importedRowNumber || index + 1),
    studentId: identity.studentId || identity.rowId,
    rowType: identity.rowType,
    source: identity.source,

    importedRowNumber: identity.importedRowNumber,
    importedSerialNo: identity.importedSerialNo,
    importedName,
    importedPhone,
    importedAdmissionNumber: identity.importedAdmissionNumber,
    importedDueDate: normalizedDueDate,
    importedPaidDate: formatDisplayDate(normalizedPaidDate),
    importedFeePaid: "",
    importedFeeStatus: identity.importedFeeStatus,
    importedExtraNote: identity.importedExtraNote,

    admissionNumber:
      identity.importedAdmissionNumber || student?.admissionNumber || "",
    name: importedName || (student ? getStudentName(student) : "Unknown Student"),
    contact: importedPhone || student?.phone || "-",
    status:
      student?.status || (identity.rowType === "raw-import" ? "imported" : "active"),
    statusUpdatedAt:
      student?.statusUpdatedAt || student?.updatedAt || student?.createdAt || null,
    feeDueDate:
      normalizedDueDate ||
      fee?.dueDate ||
      student?.joiningDate ||
      student?.createdAt ||
      null,
    feePaidDate:
      formatDisplayDate(normalizedPaidDate) ||
      fee?.paidDate ||
      fee?.paymentDate ||
      null,
    feePaid: formatDisplayDate(identity.importedFeePaid) || fee?.amountPaid || fee?.amount || "",
    feeStatus: identity.importedFeeStatus || fee?.status || "due",
    attendance,
    ...counts,
  };
};

const buildMonthlyRows = async ({
  academyObjectId,
  batchObjectId,
  days,
  attendanceDocs,
}) => {
  const markedStudentIds = [];

  attendanceDocs.forEach((doc) => {
    (doc.records || []).forEach((record) => {
      if (record.student) markedStudentIds.push(record.student);
    });
  });

  const studentVisibilityFilters = [
    // Normal roster: all active and inactive students assigned to this batch.
    {
      batch: batchObjectId,
      status: { $in: ["active", "inactive"] },
    },

    // Backward compatibility for legacy/provisional profiles that were
    // imported before batch assignment was available. Include inactive rows
    // as well so the complete legacy roster stays visible below active rows.
    // Mongoose's `batch: null` matches explicit null and a missing batch field.
    {
      batch: null,
      status: { $in: ["active", "inactive"] },
    },
  ];

  if (markedStudentIds.length) {
    // Keep historical rows visible even if the student later became inactive
    // or their current batch assignment changed.
    studentVisibilityFilters.push({
      _id: { $in: markedStudentIds },
      status: { $in: ["active", "inactive"] },
    });
  }

  const students = await Student.find({
    academy: academyObjectId,
    $or: studentVisibilityFilters,
  })
    .select(
      "admissionNumber firstName lastName phone status statusUpdatedAt joiningDate createdAt updatedAt batch dob dateOfBirth fatherName schoolName address"
    )
    .lean();

  const studentMap = new Map(students.map((student) => [String(student._id), student]));

  const studentIds = students.map((student) => student._id);
  const feeMap = await getLatestFeeMap({
    academyId: academyObjectId,
    studentIds,
  });

  const rowIdentityMap = new Map();
  const attendanceByRow = new Map();

  students.forEach((student) => {
  const key = String(student._id);

  if (!rowIdentityMap.has(key)) {
    rowIdentityMap.set(key, {
      rowId: key,
      student,
      studentId: key,
      rowType: "student",
      importedRowNumber: null,
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

  attendanceDocs.forEach((doc) => {
    const dateKey = getLocalDateKey(doc.date);

    (doc.records || []).forEach((record) => {
      const identity = getRecordDisplayIdentity(record, studentMap);
      const rowKey =
        identity.importedRowNumber ||
        identity.importedPhone ||
        identity.importedName ||
        identity.studentId;

      if (!rowKey) return;

      if (!rowIdentityMap.has(String(rowKey))) {
        rowIdentityMap.set(String(rowKey), identity);
      }

      if (!attendanceByRow.has(String(rowKey))) {
        attendanceByRow.set(String(rowKey), buildBlankAttendance(days));
      }

      const rowAttendance = attendanceByRow.get(String(rowKey));
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

        return buildRowFromRecord({
          identity,
          attendance,
          index,
          fee,
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

  const batch = await Batch.findOne({
    _id: batchObjectId,
    academy: academyObjectId,
  }).lean();

  if (!batch) {
    const error = new Error("Batch not found in your academy");
    error.statusCode = 404;
    throw error;
  }

  const days = buildDays({ year: numericYear, month: numericMonth });
  const { start, end } = getMonthRange({ year: numericYear, month: numericMonth });

  const attendanceDocs = await Attendance.find({
    academy: academyObjectId,
    batch: batchObjectId,
    date: { $gte: start, $lte: end },
  }).lean();

  const dayNoteDocs = await AttendanceDayNote.find({
    academy: academyObjectId,
    batch: batchObjectId,
    date: { $gte: start, $lte: end },
  }).lean();

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

  const { rows, students } = await buildMonthlyRows({
    academyObjectId,
    batchObjectId,
    days,
    attendanceDocs,
  });

  return {
    month: numericMonth,
    year: numericYear,
    batch,
    days,
    dayNotes,
    students,
    rows,
  };
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
    .populate("batch", "batchName martialArt")
    .lean();

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const yearStart = new Date(numericYear, 0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const yearEnd = new Date(numericYear, 11, 31);
  yearEnd.setHours(23, 59, 59, 999);

  const attendanceDocs = await Attendance.find({
    academy: academyObjectId,
    date: { $gte: yearStart, $lte: yearEnd },
    "records.student": studentObjectId,
  })
    .populate("batch", "batchName martialArt")
    .lean();

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
      return date.getMonth() + 1 === monthInfo.value;
    });

    let importedPaidDate = "";
    let importedFeePaid = "";
    let importedFeeStatus = "";

    monthDocs.forEach((doc) => {
      const dateKey = getLocalDateKey(doc.date);
      const record = (doc.records || []).find(
        (item) => String(item.student) === String(studentObjectId)
      );

      if (!record) return;

      attendance[dateKey] = toShortStatus(record.status);

      if (!importedPaidDate && record.importedPaidDate) {
        importedPaidDate = formatDisplayDate(record.importedPaidDate);
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
      importedFeePaid,
      importedFeeStatus,
      ...calculateCounts(attendance),
    };
  });

  return {
    year: numericYear,
    student: {
      _id: student._id,
      name: getStudentName(student),
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      admissionNumber: student.admissionNumber || "",
      phone: student.phone || "",
      contact: firstImportedRecord?.importedPhone || student.phone || "",
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

  days.forEach((day) => {
    recordsByDate.set(day.dateKey, []);
  });

  rows.forEach((row) => {
    const isRawImport = row.rowType === "raw-import";
    const studentId = String(row.studentId || "");

    if (!isRawImport && !validStudentIds.has(studentId)) return;

    days.forEach((day) => {
      const shortStatus = normalizeShortStatus(row.attendance?.[day.dateKey]);
      const longStatus = toLongStatus(shortStatus);

      if (!longStatus) return;

      recordsByDate.get(day.dateKey).push({
        student: isRawImport ? null : studentId,
        importedRowNumber: row.importedRowNumber || null,
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
      });
    });
  });

  const operations = [];

  for (const [dateKey, records] of recordsByDate.entries()) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);

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

  return getMonthlyAttendanceRegister({
    academyId: academyObjectId,
    batchId: batchObjectId,
    month: numericMonth,
    year: numericYear,
  });
};
