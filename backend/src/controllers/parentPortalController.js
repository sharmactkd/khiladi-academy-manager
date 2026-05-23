import StudentGuardian from "../models/StudentGuardian.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import StudentTimeline from "../models/StudentTimeline.js";
import GeneratedIdCard from "../models/GeneratedIdCard.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const requireParentPortalUser = (req, res) => {
  if (!["parent", "student"].includes(req.user.role)) {
    errorResponse(res, "Only parent/student portal users can access this route", 403);
    return false;
  }
  return true;
};

const getActiveLink = async ({ userId, studentId }) => {
  return StudentGuardian.findOne({
    guardianUser: userId,
    student: studentId,
    isActive: true,
  }).populate("student", "name studentCode phone email parentName parentPhone photo gender dob beltRank martialArt status batch academy");
};

export const getMyPortalStudents = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const links = await StudentGuardian.find({
    guardianUser: req.user._id,
    isActive: true,
  })
    .populate("academy", "academyName city state")
    .populate("student", "name studentCode photo beltRank status batch")
    .sort({ createdAt: -1 });

  return successResponse(res, "Portal students fetched successfully", { links });
});

export const getPortalStudentProfile = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const link = await getActiveLink({
    userId: req.user._id,
    studentId: req.params.studentId,
  });

  if (!link) {
    return errorResponse(res, "You are not linked with this student", 403);
  }

  return successResponse(res, "Student profile fetched successfully", {
    student: link.student,
    permissions: {
      canViewAttendance: link.canViewAttendance,
      canViewFees: link.canViewFees,
      canViewProgress: link.canViewProgress,
      canViewDocuments: link.canViewDocuments,
    },
  });
});

export const getPortalStudentAttendance = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const link = await getActiveLink({
    userId: req.user._id,
    studentId: req.params.studentId,
  });

  if (!link) return errorResponse(res, "You are not linked with this student", 403);
  if (!link.canViewAttendance) return errorResponse(res, "Attendance access disabled", 403);

  const attendance = await Attendance.find({
    academy: link.academy,
    "records.student": req.params.studentId,
  })
    .sort({ date: -1 })
    .populate("batch", "batchName martialArt")
    .lean();

  const records = attendance.map((sheet) => ({
    _id: sheet._id,
    date: sheet.date,
    batch: sheet.batch,
    record: sheet.records.find(
      (record) => String(record.student) === String(req.params.studentId)
    ),
  }));

  return successResponse(res, "Student attendance fetched successfully", { records });
});

export const getPortalStudentFees = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const link = await getActiveLink({
    userId: req.user._id,
    studentId: req.params.studentId,
  });

  if (!link) return errorResponse(res, "You are not linked with this student", 403);
  if (!link.canViewFees) return errorResponse(res, "Fee access disabled", 403);

  const payments = await FeePayment.find({
    academy: link.academy,
    student: req.params.studentId,
  })
    .sort({ month: -1, createdAt: -1 })
    .select("amount discount finalAmount month dueDate paidDate status paymentMode receiptNumber");

  return successResponse(res, "Student fee data fetched successfully", { payments });
});

export const getPortalStudentProgress = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const link = await getActiveLink({
    userId: req.user._id,
    studentId: req.params.studentId,
  });

  if (!link) return errorResponse(res, "You are not linked with this student", 403);
  if (!link.canViewProgress) return errorResponse(res, "Progress access disabled", 403);

  const [beltTests, championshipRecords, timeline] = await Promise.all([
    BeltTest.find({
      academy: link.academy,
      student: req.params.studentId,
      isDeleted: false,
    }).sort({ testDate: -1 }),
    ChampionshipRecord.find({
      academy: link.academy,
      student: req.params.studentId,
      isDeleted: false,
    }).sort({ date: -1 }),
    StudentTimeline.find({
      academy: link.academy,
      student: req.params.studentId,
    }).sort({ date: -1, createdAt: -1 }),
  ]);

  return successResponse(res, "Student progress fetched successfully", {
    beltTests,
    championshipRecords,
    timeline,
  });
});

export const getPortalStudentDocuments = asyncHandler(async (req, res) => {
  if (!requireParentPortalUser(req, res)) return;

  const link = await getActiveLink({
    userId: req.user._id,
    studentId: req.params.studentId,
  });

  if (!link) return errorResponse(res, "You are not linked with this student", 403);
  if (!link.canViewDocuments) return errorResponse(res, "Document access disabled", 403);

  const [idCards, certificates] = await Promise.all([
    GeneratedIdCard.find({
      academy: link.academy,
      student: req.params.studentId,
    })
      .sort({ issuedDate: -1 })
      .populate("template"),
    GeneratedCertificate.find({
      academy: link.academy,
      student: req.params.studentId,
    })
      .sort({ issueDate: -1 })
      .populate("template")
      .populate("relatedBeltTest")
      .populate("relatedChampionshipRecord"),
  ]);

  return successResponse(res, "Student documents fetched successfully", {
    idCards,
    certificates,
  });
});