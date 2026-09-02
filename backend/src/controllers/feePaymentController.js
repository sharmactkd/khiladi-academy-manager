import Student from "../models/Student.js";
import FeePayment from "../models/FeePayment.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { getCurrencySymbol } from "../utils/currency.js";
import { buildSafeSearchRegex } from "../utils/search.js";
import {
  buildStudentFeeStatus,
  buildStudentsFeeStatuses,
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
    const searchRegex = buildSafeSearchRegex(query.search, 100);
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { admissionNumber: searchRegex },
      { phone: searchRegex },
    ];
  }

  return Student.find(filter)
    .populate(
      "batch",
      "batchName martialArt isActive monthlyFee feeDueDay"
    )
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
    .sort({ firstName: 1, lastName: 1 });
};

export const getFeesDashboard = asyncHandler(async (req, res) => {
  const { month, year } = getMonthYearFromQuery(req.query);
  const trendPeriods = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 6 + index, 1);
    return { feeMonth: date.getMonth() + 1, feeYear: date.getFullYear() };
  });
  const paymentFilter = {
    academy: req.academyId,
    status: { $ne: "cancelled" },
  };
  const recentPaymentsQuery = FeePayment.find(paymentFilter)
    .populate({
      path: "student",
      select: "firstName lastName admissionNumber phone branch",
      populate: {
        path: "branch",
        select: "branchName currencyCode currencySymbol currencyCountryCode",
      },
    })
    .populate("batch", "batchName")
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
    .sort({ paymentDate: -1 })
    .limit(10)
    .lean();

  const academyObjectId = new mongoose.Types.ObjectId(String(req.academyId));
  const [payments, totalCollectionResult, recentPaymentDocuments] =
    await Promise.all([
      FeePayment.find({ ...paymentFilter, $or: trendPeriods })
        .select("feeMonth feeYear amountPaid paymentMode")
        .lean(),
      FeePayment.aggregate([
        {
          $match: {
            academy: academyObjectId,
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
      recentPaymentsQuery,
    ]);

  const thisMonthPayments = payments.filter(
    (payment) =>
      Number(payment.feeMonth) === month && Number(payment.feeYear) === year
  );

  const totalCollection = Number(totalCollectionResult[0]?.total || 0);

  const thisMonthCollection = thisMonthPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const previousMonthDate = new Date(year, month - 2, 1);
  const previousMonthPayments = payments.filter(
    (payment) =>
      Number(payment.feeMonth) === previousMonthDate.getMonth() + 1 &&
      Number(payment.feeYear) === previousMonthDate.getFullYear()
  );
  const previousMonthCollection = previousMonthPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const monthlyTrend = trendPeriods.map(({ feeMonth: trendMonth, feeYear: trendYear }) => {
    const date = new Date(trendYear, trendMonth - 1, 1);
    const amount = payments
      .filter(
        (payment) =>
          Number(payment.feeMonth) === trendMonth &&
          Number(payment.feeYear) === trendYear
      )
      .reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);

    return {
      month: trendMonth,
      year: trendYear,
      label: date.toLocaleString("en-US", { month: "short" }),
      amount,
    };
  });

  const paymentMix = thisMonthPayments.reduce(
    (acc, payment) => {
      const mode = ["cash", "online", "cash_online"].includes(payment.paymentMode)
        ? payment.paymentMode
        : "online";
      acc[mode].amount += Number(payment.amountPaid || 0);
      acc[mode].transactions += 1;
      return acc;
    },
    {
      cash: { amount: 0, transactions: 0 },
      online: { amount: 0, transactions: 0 },
      cash_online: { amount: 0, transactions: 0 },
    }
  );

  const students = await getActiveStudents(req.academyId);
  const statuses = await buildStudentsFeeStatuses({
    academyId: req.academyId,
    students,
    month,
    year,
  });

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

  const recentPayments = recentPaymentDocuments.map((payment) => {
    const currentBranch = payment.student?.branch || payment.branch || null;
    const currencyCode = currentBranch?.currencyCode || payment.currencyCode || "INR";

    return {
      _id: payment._id,
      studentId: payment.student?._id || null,
      studentName: getStudentName(payment.student),
      admissionNumber: payment.student?.admissionNumber || "",
      branchId: currentBranch?._id || null,
      branch: currentBranch,
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate,
      dueDate: payment.dueDate || null,
      paidDate: payment.paidDate || (Number(payment.amountPaid) > 0 ? payment.paymentDate : null),
      paymentMode: payment.paymentMode,
      cashAmount: payment.cashAmount || 0,
      onlineAmount: payment.onlineAmount || 0,
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      currencyCode,
      currencySymbol:
        currentBranch?.currencySymbol ||
        payment.currencySymbol ||
        getCurrencySymbol(currencyCode),
      currencyCountryCode:
        currentBranch?.currencyCountryCode ||
        payment.currencyCountryCode ||
        "IN",
    };
  });

  const collectionRate = students.length
    ? Number(((summary.paid / students.length) * 100).toFixed(1))
    : 0;
  const collectionChangePercent = previousMonthCollection > 0
    ? Number((((thisMonthCollection - previousMonthCollection) / previousMonthCollection) * 100).toFixed(1))
    : thisMonthCollection > 0
      ? 100
      : 0;

  return successResponse(res, "Fees dashboard fetched successfully", {
    month,
    year,
    totalCollection,
    thisMonthCollection,
    previousMonthCollection,
    collectionChangePercent,
    collectionRate,
    activeStudents: students.length,
    totalTransactions: thisMonthPayments.length,
    pendingAmount,
    overdueStudents: summary.overdue,
    summary,
    monthlyTrend,
    paymentMix,
    recentPayments,
  });
});

export const getStudentsFeeStatus = asyncHandler(async (req, res) => {
  const { month, year } = getMonthYearFromQuery(req.query);

  const students = await getActiveStudents(req.academyId, req.query);

  const data = await buildStudentsFeeStatuses({
    academyId: req.academyId,
    students,
    month,
    year,
  });

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
      .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
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

  const data = await buildStudentsFeeStatuses({
    academyId: req.academyId,
    students,
    month,
    year,
  });

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

  if (req.query.search) {
    const searchRegex = buildSafeSearchRegex(req.query.search, 100);
    const studentIds = await Student.find({
      academy: req.academyId,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { admissionNumber: searchRegex },
        { phone: searchRegex },
      ],
    }).distinct("_id");
    query.$or = [
      { student: { $in: studentIds } },
      { receiptNumber: searchRegex },
    ];
  }

  const buildPaymentsQuery = () => FeePayment.find(query)
    .populate({
      path: "student",
      select: "firstName lastName admissionNumber phone email branch",
      populate: {
        path: "branch",
        select: "branchName currencyCode currencySymbol currencyCountryCode",
      },
    })
    .populate("batch", "batchName martialArt")
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
    .populate("feePlan", "name monthlyAmount amount dueDay")
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();

  const isPaginated = req.query.paginated === "true" || Boolean(req.query.page);
  if (isPaginated) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const aggregateQuery = {
      ...query,
      academy: new mongoose.Types.ObjectId(String(req.academyId)),
    };
    const [payments, total, totals] = await Promise.all([
      buildPaymentsQuery().skip((page - 1) * limit).limit(limit),
      FeePayment.countDocuments(query),
      FeePayment.aggregate([
        { $match: aggregateQuery },
        {
          $group: {
            _id: null,
            collected: { $sum: { $ifNull: ["$amountPaid", 0] } },
            balance: { $sum: { $ifNull: ["$pendingAmount", 0] } },
            paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
            split: { $sum: { $cond: [{ $eq: ["$paymentMode", "cash_online"] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const pages = Math.max(Math.ceil(total / limit), 1);
    return successResponse(res, "Fee payments fetched successfully", {
      payments,
      pagination: { page, limit, total, pages, hasNextPage: page < pages },
      summary: totals[0] || { collected: 0, balance: 0, paid: 0, split: 0 },
    });
  }

  const payments = await buildPaymentsQuery();

  return successResponse(res, "Fee payments fetched successfully", payments);
});

export const getStudentFeePayments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.studentId,
    academy: req.academyId,
  })
    .populate("batch", "batchName martialArt isActive")
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode");

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const payments = await FeePayment.find({
    academy: req.academyId,
    student: student._id,
    status: { $ne: "cancelled" },
  })
    .populate("batch", "batchName martialArt")
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
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
    .populate({
      path: "student",
      select: "firstName lastName admissionNumber phone email address branch",
      populate: {
        path: "branch",
        select: "branchName address city state country currencyCode currencySymbol currencyCountryCode",
      },
    })
    .populate("batch", "batchName martialArt")
    .populate("branch", "branchName currencyCode currencySymbol currencyCountryCode")
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
    "cashAmount",
    "onlineAmount",
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
