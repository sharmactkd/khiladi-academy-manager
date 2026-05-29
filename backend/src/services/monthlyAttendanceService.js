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

const getLatestFeeMap = async ({ academyId, studentIds }) => {
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
const students = await Student.find({
  academy: academyObjectId,
  batch: batchObjectId,
  status: "active",
})
  .select(
  "admissionNumber firstName lastName phone status joiningDate createdAt"
)
  .sort({ firstName: 1, lastName: 1, admissionNumber: 1 })
  .lean();

  const studentIds = students.map((student) => student._id);

  const [attendanceDocs, feeMap] = await Promise.all([
    Attendance.find({
      academy: academyObjectId,
      batch: batchObjectId,
      date: { $gte: start, $lte: end },
    }).lean(),
    getLatestFeeMap({ academyId: academyObjectId, studentIds }),
  ]);

  const attendanceByStudent = new Map();

  students.forEach((student) => {
    const attendance = {};
    days.forEach((day) => {
      attendance[day.dateKey] = "";
    });
    attendanceByStudent.set(String(student._id), attendance);
  });

  attendanceDocs.forEach((doc) => {
    const dateKey = new Date(doc.date).toISOString().slice(0, 10);

    (doc.records || []).forEach((record) => {
      const studentId = String(record.student);
      const studentAttendance = attendanceByStudent.get(studentId);

      if (studentAttendance) {
        studentAttendance[dateKey] = toShortStatus(record.status);
      }
    });
  });

  const rows = students.map((student, index) => {
    const fee = feeMap.get(String(student._id));
    const attendance = attendanceByStudent.get(String(student._id)) || {};
    const counts = calculateCounts(attendance);

  return {
  no: index + 1,
  studentId: student._id,
  admissionNumber: student.admissionNumber || "",
  name: getStudentName(student),
  contact: student.phone || "-",
  feeDueDate: student.joiningDate || student.createdAt || null,
  feePaidDate: fee?.paidDate || fee?.paymentDate || null,
  feePaid: fee?.amountPaid ?? fee?.amount ?? 0,
  feeStatus: fee?.status || "due",
  attendance,
  ...counts,
};
  });

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
    .map((row) => row.studentId)
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

  const validStudents = await Student.find({
    _id: { $in: studentIds },
    academy: academyObjectId,
    batch: batchObjectId,
    status: "active",
  }).select("_id");

  const validStudentIds = new Set(validStudents.map((item) => String(item._id)));

  const recordsByDate = new Map();

  days.forEach((day) => {
    recordsByDate.set(day.dateKey, []);
  });

  rows.forEach((row) => {
    const studentId = String(row.studentId || "");

    if (!validStudentIds.has(studentId)) return;

    days.forEach((day) => {
      const shortStatus = normalizeShortStatus(row.attendance?.[day.dateKey]);
      const longStatus = toLongStatus(shortStatus);

      if (!longStatus) return;

      recordsByDate.get(day.dateKey).push({
        student: studentId,
        status: longStatus,
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