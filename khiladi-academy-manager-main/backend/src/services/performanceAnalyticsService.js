import mongoose from "mongoose";

import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import SkillAssessment from "../models/SkillAssessment.js";

import { buildBranchAccessFilter } from "./branchAccessService.js";

const objectId = (id) => new mongoose.Types.ObjectId(id);

const percentage = (value, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
};

const clampScore = (score) => {
  const value = Number(score || 0);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
};

const medalWeight = (medal = "") => {
  const value = String(medal || "").toLowerCase();

  if (["gold", "1st", "first", "winner"].includes(value)) return 10;
  if (["silver", "2nd", "second", "runner"].includes(value)) return 7;
  if (["bronze", "3rd", "third"].includes(value)) return 5;
  if (value) return 3;

  return 0;
};

export const calculateStudentPerformance = async ({
  academyId,
  studentId,
  user,
}) => {
  const student = await Student.findOne({
    _id: studentId,
    academy: academyId,
    ...buildBranchAccessFilter(user),
  })
    .populate("branch", "branchName branchCode")
    .lean();

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const [
    attendanceTotal,
    attendancePresent,
    feeRecords,
    beltPromotions,
    medals,
    certificatesCount,
    skillAverageResult,
  ] = await Promise.all([
    Attendance.countDocuments({
      academy: academyId,
      student: student._id,
    }),

    Attendance.countDocuments({
      academy: academyId,
      student: student._id,
      status: "present",
    }),

    FeePayment.find({
      academy: academyId,
      student: student._id,
    }).lean(),

    BeltTest.countDocuments({
      academy: academyId,
      student: student._id,
      $or: [{ result: "passed" }, { status: "passed" }],
    }),

    ChampionshipRecord.find({
      academy: academyId,
      student: student._id,
    }).lean(),

    GeneratedCertificate.countDocuments({
      academy: academyId,
      student: student._id,
    }),

    SkillAssessment.aggregate([
      {
        $match: {
          academy: objectId(academyId),
          student: objectId(student._id),
        },
      },
      {
        $group: {
          _id: null,
          average: {
            $avg: {
              $multiply: [{ $divide: ["$score", "$maxScore"] }, 100],
            },
          },
        },
      },
    ]),
  ]);

  const attendancePercentage = percentage(attendancePresent, attendanceTotal);

  const totalFeeRecords = feeRecords.length;
  const paidFeeRecords = feeRecords.filter((fee) =>
    ["paid", "completed", "success"].includes(String(fee.status || ""))
  ).length;

  const feeRegularity = percentage(paidFeeRecords, totalFeeRecords);

  const medalPoints = medals.reduce((sum, item) => {
    return sum + medalWeight(item.medal || item.result);
  }, 0);

  const tournamentMedals = medals.length;
  const skillAverage = Math.round(skillAverageResult?.[0]?.average || 0);

  const beltScore = clampScore(beltPromotions * 12);
  const medalScore = clampScore(medalPoints * 4);
  const certificateScore = clampScore(certificatesCount * 8);

  const overallPerformanceScore = clampScore(
    attendancePercentage * 0.3 +
      feeRegularity * 0.15 +
      beltScore * 0.15 +
      medalScore * 0.15 +
      skillAverage * 0.2 +
      certificateScore * 0.05
  );

  return {
    student,
    attendancePercentage,
    feeRegularity,
    beltProgress: {
      promotions: beltPromotions,
      score: beltScore,
    },
    tournamentMedals,
    medalPoints,
    certificatesCount,
    skillAverage,
    overallPerformanceScore,
    breakdown: {
      attendanceWeight: "30%",
      feeWeight: "15%",
      beltWeight: "15%",
      medalWeight: "15%",
      skillWeight: "20%",
      certificateWeight: "5%",
    },
  };
};

export const calculateAcademyPerformance = async ({
  academyId,
  query = {},
  user,
}) => {
  const studentFilter = {
    academy: academyId,
    ...buildBranchAccessFilter(user),
  };

  if (query.branch) {
    studentFilter.branch = query.branch;
  }

  const students = await Student.find(studentFilter)
    .select("firstName lastName admissionNumber branch status")
    .populate("branch", "branchName branchCode")
    .lean();

  const performances = [];

  for (const student of students) {
    const performance = await calculateStudentPerformance({
      academyId,
      studentId: student._id,
      user,
    });

    performances.push(performance);
  }

  const topPerformers = [...performances]
    .sort((a, b) => b.overallPerformanceScore - a.overallPerformanceScore)
    .slice(0, 10);

  const lowAttendanceStudents = performances
    .filter((item) => item.attendancePercentage < 60)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
    .slice(0, 10);

  const pendingFeeRisk = performances
    .filter((item) => item.feeRegularity < 60)
    .sort((a, b) => a.feeRegularity - b.feeRegularity)
    .slice(0, 10);

  const medalLeaders = performances
    .filter((item) => item.tournamentMedals > 0)
    .sort((a, b) => b.medalPoints - a.medalPoints)
    .slice(0, 10);

  const skillLeaders = performances
    .filter((item) => item.skillAverage > 0)
    .sort((a, b) => b.skillAverage - a.skillAverage)
    .slice(0, 10);

  const averagePerformance =
    performances.length > 0
      ? Math.round(
          performances.reduce(
            (sum, item) => sum + item.overallPerformanceScore,
            0
          ) / performances.length
        )
      : 0;

  return {
    totalStudents: students.length,
    averagePerformance,
    topPerformers,
    lowAttendanceStudents,
    pendingFeeRisk,
    medalLeaders,
    skillLeaders,
  };
};

export const calculateBatchPerformance = async ({
  academyId,
  batchId,
  user,
}) => {
  const batch = await Batch.findOne({
    _id: batchId,
    academy: academyId,
    ...buildBranchAccessFilter(user),
  })
    .populate("branch", "branchName branchCode")
    .populate("students", "firstName lastName admissionNumber status branch")
    .lean();

  if (!batch) {
    const error = new Error("Batch not found");
    error.statusCode = 404;
    throw error;
  }

  const studentIds = Array.isArray(batch.students)
    ? batch.students.map((student) => student._id)
    : [];

  const performances = [];

  for (const studentId of studentIds) {
    const performance = await calculateStudentPerformance({
      academyId,
      studentId,
      user,
    });

    performances.push(performance);
  }

  const attendanceAverage =
    performances.length > 0
      ? Math.round(
          performances.reduce(
            (sum, item) => sum + item.attendancePercentage,
            0
          ) / performances.length
        )
      : 0;

  const skillAverage =
    performances.length > 0
      ? Math.round(
          performances.reduce((sum, item) => sum + item.skillAverage, 0) /
            performances.length
        )
      : 0;

  const overallAverage =
    performances.length > 0
      ? Math.round(
          performances.reduce(
            (sum, item) => sum + item.overallPerformanceScore,
            0
          ) / performances.length
        )
      : 0;

  return {
    batch,
    studentCount: studentIds.length,
    attendanceAverage,
    skillAverage,
    overallAverage,
    students: performances,
  };
};