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