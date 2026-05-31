import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import FeePayment from "../models/FeePayment.js";

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

const normalizeImportedIdentity = (record = {}) => {
  const importedName = clean(record.importedName);
  const importedPhone = normalizePhone(record.importedPhone);
  const importedAdmissionNumber = clean(record.importedAdmissionNumber);

  return {
    importedName,
    importedPhone,
    importedAdmissionNumber,
  };
};

const getRawRowId = (record = {}) => {
  const { importedName, importedPhone, importedAdmissionNumber } =
    normalizeImportedIdentity(record);

  return [
    "raw",
    importedPhone || "-",
    importedAdmissionNumber.toLowerCase() || "-",
    importedName.toLowerCase() || "-",
  ].join(":");
};

const getRecordRowId = (record = {}) => {
  if (record.student) {
    return String(record.student);
  }

  return getRawRowId(record);
};

const getLocalDateKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
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
  if (!studentIds.length) {
    return new Map();
  }

  const payments = await FeePayment.find({
    academy: academyId,
    student: { $in: studentIds },
  })
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();

  const map = new Map();

  payments.forEach((payment) => {
    const key = String(payment.student);
    if (!map.has(key)) {
      map.set(key, payment);
    }
  });

  return map;
};

const createStudentRow = ({ student, index, attendance, fee }) => {
  const counts = calculateCounts(attendance);

  return {
    no: index + 1,
    studentId: String(student._id),
    rowType: "student",
    admissionNumber: student.admissionNumber || "",
    name: getStudentName(student),
    contact: student.phone || "-",
    status: student.status || "active",
    feeDueDate: student.joiningDate || student.createdAt || null,
    feePaidDate: fee?.paidDate || fee?.paymentDate || null,
    feePaid: fee?.amountPaid ?? fee?.amount ?? 0,
    feeStatus: fee?.status || "due",
    attendance,
    ...counts,
  };
};

const createRawRow = ({ rawRecord, index, attendance }) => {
  const { importedName, importedPhone, importedAdmissionNumber } =
    normalizeImportedIdentity(rawRecord);

  const counts = calculateCounts(attendance);

  return {
    no: index + 1,
    studentId: getRawRowId(rawRecord),
    rowType: "raw-import",
    admissionNumber: importedAdmissionNumber || "",
    name: importedName || "Unknown Imported Student",
    contact: importedPhone || "-",
    status: "imported",
    feeDueDate: null,
    feePaidDate: null,
    feePaid: 0,
    feeStatus: "imported",
    attendance,
    ...counts,
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
  const { start, end } = getMonthRange({
    year: numericYear,
    month: numericMonth,
  });

  const attendanceDocs = await Attendance.find({
    academy: academyObjectId,
    batch: batchObjectId,
    date: { $gte: start, $lte: end },
  }).lean();

  const markedStudentIds = [];
  const rawRecordSamples = new Map();

  attendanceDocs.forEach((doc) => {
    (doc.records || []).forEach((record) => {
      if (record.student) {
        markedStudentIds.push(record.student);
        return;
      }

      const rawRowId = getRawRowId(record);
      if (!rawRecordSamples.has(rawRowId)) {
        rawRecordSamples.set(rawRowId, record);
      }
    });
  });

  const students = await Student.find({
    academy: academyObjectId,
    $or: [
      { batch: batchObjectId },
      {
        _id: {
          $in: markedStudentIds,
        },
      },
    ],
  })
    .select(
      "admissionNumber firstName lastName phone status joiningDate createdAt batch"
    )
    .sort({ firstName: 1, lastName: 1, admissionNumber: 1 })
    .lean();

  const studentIds = students.map((student) => student._id);
  const feeMap = await getLatestFeeMap({
    academyId: academyObjectId,
    studentIds,
  });

  const attendanceByRow = new Map();

  students.forEach((student) => {
    attendanceByRow.set(String(student._id), buildBlankAttendance(days));
  });

  rawRecordSamples.forEach((record, rawRowId) => {
    attendanceByRow.set(rawRowId, buildBlankAttendance(days));
  });

  attendanceDocs.forEach((doc) => {
    const dateKey = getLocalDateKey(doc.date);

    (doc.records || []).forEach((record) => {
      const rowId = getRecordRowId(record);

      if (!attendanceByRow.has(rowId)) {
        attendanceByRow.set(rowId, buildBlankAttendance(days));

        if (!record.student && !rawRecordSamples.has(rowId)) {
          rawRecordSamples.set(rowId, record);
        }
      }

      const rowAttendance = attendanceByRow.get(rowId);

      if (rowAttendance && dateKey) {
        rowAttendance[dateKey] = toShortStatus(record.status);
      }
    });
  });

  const studentRows = students.map((student, index) => {
    const attendance = attendanceByRow.get(String(student._id)) || {};
    const fee = feeMap.get(String(student._id));

    return createStudentRow({
      student,
      index,
      attendance,
      fee,
    });
  });

  const rawRows = Array.from(rawRecordSamples.values())
    .sort((a, b) =>
      String(a.importedName || "").localeCompare(String(b.importedName || ""))
    )
    .map((record, index) => {
      const rawRowId = getRawRowId(record);
      const attendance = attendanceByRow.get(rawRowId) || {};

      return createRawRow({
        rawRecord: record,
        index: studentRows.length + index,
        attendance,
      });
    });

  const rows = [...studentRows, ...rawRows].map((row, index) => ({
    ...row,
    no: index + 1,
  }));

  return {
    month: numericMonth,
    year: numericYear,
    batch,
    days,
    students,
    rows,
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

      if (isRawImport) {
        recordsByDate.get(day.dateKey).push({
          student: null,
          importedName: clean(row.name),
          importedPhone: normalizePhone(row.contact),
          importedAdmissionNumber: clean(row.admissionNumber),
          status: longStatus,
          source: "excel-import",
          note: "Saved from monthly register raw imported row",
        });

        return;
      }

      recordsByDate.get(day.dateKey).push({
        student: studentId,
        status: longStatus,
        source: "manual",
        note: "",
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