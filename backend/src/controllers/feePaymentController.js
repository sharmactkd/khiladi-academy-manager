import Student from "../models/Student.js";
import FeePayment from "../models/FeePayment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  buildStudentFeeStatus,
  collectStudentFee,
  getMonthYearNow,
} from "../services/feeService.js";

const getStudentName = (student) =>
  `${student?.firstName || ""} ${student?.lastName || ""}`.trim();

const getMonthYearFromQuery = (query) => {
  const now = getMonthYearNow();

  return {
    month: Number(query.month || query.feeMonth || now.month),
    year: Number(query.year || query.feeYear || now.year),
  };
};

const getActiveStudents = async (academyId, query = {}) => {
  const filter = {
    academy: academyId,
    status: "active",
  };

  if (query.batch) {
    filter.batch = query.batch;
  }

  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: "i" } },
      { lastName: { $regex: query.search, $options: "i" } },
      { admissionNumber: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
    ];
  }

  return Student.find(filter)
    .populate("batch", "batchName martialArt isActive")
    .sort({ firstName: 1, lastName: 1 });
};

export const getFeesDashboard = asyncHandler(async (req, res) => {
  const { month, year } = getMonthYearFromQuery(req.query);

  const payments = await FeePayment.find({
    academy: req.academyId,
    status: { $ne: "cancelled" },
  })
    .populate("student", "firstName lastName admissionNumber phone")
    .populate("batch", "batchName")
    .sort({ paymentDate: -1 });

  const thisMonthPayments = payments.filter(
    (payment) =>
      Number(payment.feeMonth) === month && Number(payment.feeYear) === year
  );

  const totalCollection = payments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const thisMonthCollection = thisMonthPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const students = await getActiveStudents(req.academyId);
  const statuses = await Promise.all(
    students.map((student) =>
      buildStudentFeeStatus({
        academyId: req.academyId,
        student,
        month,
        year,
      })
    )
  );

  const pendingAmount = statuses.reduce(
    (sum, item) => sum + Number(item.pendingAmount || 0),
    0
  );

  const summary = statuses.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {
      paid: 0,
      due: 0,
      partial: 0,
      overdue: 0,
    }
  );

  const recentPayments = payments.slice(0, 10).map((payment) => ({
    _id: payment._id,
    studentName: getStudentName(payment.student),
    admissionNumber: payment.student?.admissionNumber || "",
    amountPaid: payment.amountPaid,
    paymentDate: payment.paymentDate,
    paymentMode: payment.paymentMode,
    receiptNumber: payment.receiptNumber,
    status: payment.status,
  }));

  return successResponse(res, "Fees dashboard fetched successfully", {
    month,
    year,
    totalCollection,
    thisMonthCollection,
    pendingAmount,
    overdueStudents: summary.overdue,
    summary,
    recentPayments,
  });
});

export const getStudentsFeeStatus = asyncHandler(async (req, res) => {
  const { month, year } = getMonthYearFromQuery(req.query);

  const students = await getActiveStudents(req.academyId, req.query);

  const data = await Promise.all(
    students.map((student) =>
      buildStudentFeeStatus({
        academyId: req.academyId,
        student,
        month,
        year,
      })
    )
  );

  const filteredData = req.query.status
    ? data.filter((item) => item.status === req.query.status)
    : data;

  return successResponse(res, "Students fee status fetched successfully", {
    month,
    year,
    students: filteredData,
  });
});

export const collectFee = asyncHandler(async (req, res) => {
  try {
    const feePayment = await collectStudentFee({
      academyId: req.academyId,
      userId: req.user._id,
      payload: req.body,
    });

    const populatedPayment = await FeePayment.findById(feePayment._id)
      .populate("student", "firstName lastName admissionNumber phone email")
      .populate("batch", "batchName martialArt")
      .populate("feePlan", "name monthlyAmount amount dueDay");

    return successResponse(
      res,
      "Fee collected successfully",
      populatedPayment,
      201
    );
  } catch (error) {
    return errorResponse(res, error.message || "Fee collection failed", 400);
  }
});

export const getPendingFees = asyncHandler(async (req, res) => {
  const { month, year } = getMonthYearFromQuery(req.query);

  const students = await getActiveStudents(req.academyId, req.query);

  const data = await Promise.all(
    students.map((student) =>
      buildStudentFeeStatus({
        academyId: req.academyId,
        student,
        month,
        year,
      })
    )
  );

  const pending = data.filter((item) =>
    ["due", "partial", "overdue"].includes(item.status)
  );

  return successResponse(res, "Pending fees fetched successfully", {
    month,
    year,
    students: pending,
  });
});

export const getFeePayments = asyncHandler(async (req, res) => {
  const query = {
    academy: req.academyId,
  };

  if (req.query.student) query.student = req.query.student;
  if (req.query.batch) query.batch = req.query.batch;
  if (req.query.status) query.status = req.query.status;
  if (req.query.paymentMode) query.paymentMode = req.query.paymentMode;
  if (req.query.month) query.feeMonth = Number(req.query.month);
  if (req.query.year) query.feeYear = Number(req.query.year);

  const payments = await FeePayment.find(query)
    .populate("student", "firstName lastName admissionNumber phone email")
    .populate("batch", "batchName martialArt")
    .populate("feePlan", "name monthlyAmount amount dueDay")
    .sort({ paymentDate: -1, createdAt: -1 });

  return successResponse(res, "Fee payments fetched successfully", payments);
});

export const getStudentFeePayments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.studentId,
    academy: req.academyId,
  }).populate("batch", "batchName martialArt isActive");

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const payments = await FeePayment.find({
    academy: req.academyId,
    student: student._id,
    status: { $ne: "cancelled" },
  })
    .populate("batch", "batchName martialArt")
    .populate("feePlan", "name monthlyAmount amount dueDay")
    .sort({ feeYear: -1, feeMonth: -1, paymentDate: -1 });

  const { month, year } = getMonthYearNow();
  const currentStatus = await buildStudentFeeStatus({
    academyId: req.academyId,
    student,
    month,
    year,
  });

  return successResponse(res, "Student fee history fetched successfully", {
    student,
    currentStatus,
    payments,
  });
});

export const getFeePaymentById = asyncHandler(async (req, res) => {
  const payment = await FeePayment.findOne({
    _id: req.params.id,
    academy: req.academyId,
  })
    .populate("student", "firstName lastName admissionNumber phone email address")
    .populate("batch", "batchName martialArt")
    .populate("feePlan", "name monthlyAmount amount dueDay")
    .populate("collectedBy", "name email");

  if (!payment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  return successResponse(res, "Fee payment fetched successfully", payment);
});

export const updateFeePayment = asyncHandler(async (req, res) => {
  const payment = await FeePayment.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!payment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  const allowedFields = [
    "amount",
    "discount",
    "amountPaid",
    "paymentDate",
    "paymentMode",
    "notes",
    "note",
    "dueDate",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      payment[field] = req.body[field];
    }
  });

  payment.updatedBy = req.user._id;

  await payment.save();

  return successResponse(res, "Fee payment updated successfully", payment);
});

export const deleteFeePayment = asyncHandler(async (req, res) => {
  const payment = await FeePayment.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!payment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  payment.status = "cancelled";
  payment.updatedBy = req.user._id;

  await payment.save();

  return successResponse(res, "Fee payment cancelled successfully", payment);
});