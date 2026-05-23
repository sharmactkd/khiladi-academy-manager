import mongoose from "mongoose";

import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import GeneratedIdCard from "../models/GeneratedIdCard.js";
import SkillAssessment from "../models/SkillAssessment.js";

const objectId = (id) => new mongoose.Types.ObjectId(id);

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const buildAnalyticsFilters = ({ academyId, query = {}, user }) => {
  const filters = {
    academy: objectId(academyId),
  };

  if (query.branch) {
    filters.branch = objectId(query.branch);
  }

  if (query.batch) {
    filters.batch = objectId(query.batch);
  }

  if (query.fromDate || query.toDate) {
    filters.createdAt = {};

    if (query.fromDate) {
      filters.createdAt.$gte = startOfDay(query.fromDate);
    }

    if (query.toDate) {
      filters.createdAt.$lte = endOfDay(query.toDate);
    }
  }

  if (user?.role === "assistant_coach") {
    const assignedBranches = [
      user.branch,
      user.branchId,
      user.assignedBranch,
      ...(Array.isArray(user.branches) ? user.branches : []),
      ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
    ].filter(Boolean);

    if (assignedBranches.length) {
      filters.branch = {
        $in: assignedBranches
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => objectId(id)),
      };
    } else {
      filters.branch = { $in: [] };
    }
  }

  return filters;
};

const buildDateFilter = ({ fromDate, toDate, field = "createdAt" }) => {
  const filter = {};

  if (fromDate || toDate) {
    filter[field] = {};

    if (fromDate) filter[field].$gte = startOfDay(fromDate);
    if (toDate) filter[field].$lte = endOfDay(toDate);
  }

  return filter;
};

const monthGroup = {
  year: { $year: "$createdAt" },
  month: { $month: "$createdAt" },
};

const formatMonthResults = (items = []) =>
  items.map((item) => ({
    label: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
    value: item.count || item.total || 0,
  }));

export const getDashboardAnalytics = async ({ academyId, query, user }) => {
  const base = buildAnalyticsFilters({ academyId, query, user });
  const branchBase = { academy: objectId(academyId) };

  if (base.branch) branchBase.branch = base.branch;

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    leftStudents,
    totalBatches,
    monthlyFees,
    pendingFees,
    todayAttendanceCount,
    presentToday,
    upcomingBeltTests,
    recentAdmissions,
    recentPayments,
    medalAgg,
    certificatesIssued,
    idCardsGenerated,
  ] = await Promise.all([
    Student.countDocuments(branchBase),
    Student.countDocuments({ ...branchBase, status: "active" }),
    Student.countDocuments({ ...branchBase, status: "inactive" }),
    Student.countDocuments({ ...branchBase, status: "left" }),
    Batch.countDocuments({ ...branchBase, isActive: true }),

    FeePayment.aggregate([
      {
        $match: {
          ...branchBase,
          paymentDate: { $gte: monthStart },
          status: { $in: ["paid", "partial", "completed", "success"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$amountPaid", "$amount"] } },
        },
      },
    ]),

    FeePayment.aggregate([
      {
        $match: {
          ...branchBase,
          status: { $in: ["pending", "partial"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$pendingAmount", "$amount"] } },
        },
      },
    ]),

    Attendance.countDocuments({
      ...branchBase,
      date: { $gte: todayStart, $lte: todayEnd },
    }),

    Attendance.countDocuments({
      ...branchBase,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "present",
    }),

    BeltTest.countDocuments({
      ...branchBase,
      testDate: { $gte: new Date() },
    }),

    Student.find(branchBase)
      .populate("branch", "branchName branchCode")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    FeePayment.find(branchBase)
      .populate("student", "firstName lastName admissionNumber")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    ChampionshipRecord.aggregate([
      { $match: branchBase },
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 },
        },
      },
    ]),

    GeneratedCertificate.countDocuments(branchBase),
    GeneratedIdCard.countDocuments(branchBase),
  ]);

  const todayAttendancePercentage =
    todayAttendanceCount > 0
      ? Math.round((presentToday / todayAttendanceCount) * 100)
      : 0;

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    leftStudents,
    totalBatches,
    monthlyFeesCollected: monthlyFees?.[0]?.total || 0,
    pendingFees: pendingFees?.[0]?.total || 0,
    todayAttendanceCount,
    todayAttendancePercentage,
    upcomingBeltTests,
    recentAdmissions,
    recentPayments,
    medalCount: medalAgg.reduce((acc, item) => {
      acc[item._id || "other"] = item.count;
      return acc;
    }, {}),
    certificatesIssued,
    idCardsGenerated,
  };
};

export const getStudentAnalytics = async ({ academyId, query, user }) => {
  const base = buildAnalyticsFilters({ academyId, query, user });
  delete base.batch;

  const [admissionsByMonth, statusDistribution, beltDistribution, martialArtDistribution] =
    await Promise.all([
      Student.aggregate([
        { $match: base },
        { $group: { _id: monthGroup, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Student.aggregate([
        { $match: base },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Student.aggregate([
        { $match: base },
        { $group: { _id: "$beltRank", count: { $sum: 1 } } },
      ]),

      Student.aggregate([
        { $match: base },
        { $group: { _id: "$martialArt", count: { $sum: 1 } } },
      ]),
    ]);

  return {
    admissionsByMonth: formatMonthResults(admissionsByMonth),
    statusDistribution,
    beltDistribution,
    martialArtDistribution,
  };
};

export const getAttendanceAnalytics = async ({ academyId, query, user }) => {
  const base = buildAnalyticsFilters({ academyId, query, user });
  const dateFilter = buildDateFilter({
    fromDate: query.fromDate,
    toDate: query.toDate,
    field: "date",
  });

  delete base.createdAt;

  const match = { ...base, ...dateFilter };

  const [dailyTrend, batchComparison, absentCount] = await Promise.all([
    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            batch: "$batch",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]),

    Attendance.countDocuments({
      ...match,
      status: "absent",
    }),
  ]);

  return {
    dailyAttendanceTrend: dailyTrend,
    batchAttendanceComparison: batchComparison,
    absentStudentsCount: absentCount,
  };
};

export const getFeeAnalytics = async ({ academyId, query, user }) => {
  if (user?.role === "assistant_coach") {
    const error = new Error("Assistant coach cannot access fee analytics");
    error.statusCode = 403;
    throw error;
  }

  const base = buildAnalyticsFilters({ academyId, query, user });
  delete base.batch;

  const [monthlyCollectionTrend, feeStatusStats, paymentModeDistribution] =
    await Promise.all([
      FeePayment.aggregate([
        {
          $match: {
            ...base,
            status: { $in: ["paid", "partial", "completed", "success"] },
          },
        },
        {
          $group: {
            _id: monthGroup,
            total: { $sum: { $ifNull: ["$amountPaid", "$amount"] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      FeePayment.aggregate([
        { $match: base },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: { $ifNull: ["$amount", 0] } },
          },
        },
      ]),

      FeePayment.aggregate([
        { $match: base },
        {
          $group: {
            _id: "$paymentMode",
            count: { $sum: 1 },
            total: { $sum: { $ifNull: ["$amountPaid", "$amount"] } },
          },
        },
      ]),
    ]);

  return {
    monthlyCollectionTrend: formatMonthResults(monthlyCollectionTrend),
    pendingPaidPartialStats: feeStatusStats,
    paymentModeDistribution,
  };
};

export const getPerformanceAnalytics = async ({ academyId, query, user }) => {
  const base = buildAnalyticsFilters({ academyId, query, user });
  delete base.batch;

  const [medalCount, beltPromotions, certificates, skillAverage] =
    await Promise.all([
      ChampionshipRecord.aggregate([
        { $match: base },
        { $group: { _id: "$result", count: { $sum: 1 } } },
      ]),

      BeltTest.aggregate([
        { $match: base },
        { $group: { _id: "$newBeltRank", count: { $sum: 1 } } },
      ]),

      GeneratedCertificate.countDocuments(base),

      SkillAssessment.aggregate([
        { $match: base },
        {
          $group: {
            _id: null,
            averageScore: {
              $avg: {
                $multiply: [{ $divide: ["$score", "$maxScore"] }, 100],
              },
            },
          },
        },
      ]),
    ]);

  return {
    medalCount,
    beltPromotions,
    certificates,
    skillAverage: Math.round(skillAverage?.[0]?.averageScore || 0),
  };
};