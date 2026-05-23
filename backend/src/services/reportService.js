import mongoose from "mongoose";

import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import GeneratedIdCard from "../models/GeneratedIdCard.js";
import Branch from "../models/Branch.js";
import ReportLog from "../models/ReportLog.js";

import {
  normalizeReportResponse,
  createColumn,
} from "./exportService.js";

const objectId = (id) => new mongoose.Types.ObjectId(id);

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const assistantBranchIds = (user) => {
  if (user?.role !== "assistant_coach") return [];

  return [
    user.branch,
    user.branchId,
    user.assignedBranch,
    ...(Array.isArray(user.branches) ? user.branches : []),
    ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
  ].filter(Boolean);
};

export const buildReportFilters = ({
  academyId,
  query = {},
  user,
  dateField = "createdAt",
}) => {
  const filters = {
    academy: objectId(academyId),
  };

  if (query.branch) {
    filters.branch = objectId(query.branch);
  }

  if (query.batch) {
    filters.batch = objectId(query.batch);
  }

  if (query.student) {
    filters.student = objectId(query.student);
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.fromDate || query.toDate) {
    filters[dateField] = {};

    if (query.fromDate) filters[dateField].$gte = startOfDay(query.fromDate);
    if (query.toDate) filters[dateField].$lte = endOfDay(query.toDate);
  }

  if (user?.role === "assistant_coach") {
    const branches = assistantBranchIds(user);

    if (branches.length) {
      filters.branch = {
        $in: branches
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => objectId(id)),
      };
    } else {
      filters.branch = { $in: [] };
    }
  }

  return filters;
};

export const createReportLog = async ({
  academyId,
  reportType,
  filters,
  generatedBy,
  format = "json",
  status = "generated",
  metadata = {},
}) => {
  return ReportLog.create({
    academy: academyId,
    reportType,
    filters,
    generatedBy,
    format,
    status,
    generatedAt: new Date(),
    metadata,
  });
};

export const generateStudentsReport = async ({ academyId, query, user }) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "createdAt",
  });

  const students = await Student.find(filters)
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ createdAt: -1 });

  const rows = students.map((student) => ({
    admissionNumber: student.admissionNumber || "",
    name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
    gender: student.gender || "",
    phone: student.phone || "",
    email: student.email || "",
    martialArt: student.martialArt || "",
    beltRank: student.beltRank || "",
    status: student.status || "",
    branch: student.branch?.branchName || "",
    joiningDate: student.joiningDate || "",
  }));

  return normalizeReportResponse({
    reportType: "students",
    title: "Students Report",
    filters: query,
    rows,
    summary: {
      totalStudents: rows.length,
      activeStudents: rows.filter((row) => row.status === "active").length,
      inactiveStudents: rows.filter((row) => row.status === "inactive").length,
      leftStudents: rows.filter((row) => row.status === "left").length,
    },
    columns: [
      createColumn("admissionNumber", "Admission No."),
      createColumn("name", "Student Name"),
      createColumn("gender", "Gender"),
      createColumn("phone", "Phone"),
      createColumn("email", "Email"),
      createColumn("martialArt", "Martial Art"),
      createColumn("beltRank", "Belt Rank"),
      createColumn("status", "Status"),
      createColumn("branch", "Branch"),
      createColumn("joiningDate", "Joining Date"),
    ],
  });
};

export const generateAttendanceReport = async ({ academyId, query, user }) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "date",
  });

  const records = await Attendance.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("batch", "batchName")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ date: -1 });

  const rows = records.map((record) => ({
    date: record.date || "",
    admissionNumber: record.student?.admissionNumber || "",
    student: `${record.student?.firstName || ""} ${
      record.student?.lastName || ""
    }`.trim(),
    batch: record.batch?.batchName || "",
    branch: record.branch?.branchName || "",
    status: record.status || "",
    remarks: record.remarks || "",
  }));

  return normalizeReportResponse({
    reportType: "attendance",
    title: "Attendance Report",
    filters: query,
    rows,
    summary: {
      totalRecords: rows.length,
      present: rows.filter((row) => row.status === "present").length,
      absent: rows.filter((row) => row.status === "absent").length,
      late: rows.filter((row) => row.status === "late").length,
    },
    columns: [
      createColumn("date", "Date"),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("batch", "Batch"),
      createColumn("branch", "Branch"),
      createColumn("status", "Status"),
      createColumn("remarks", "Remarks"),
    ],
  });
};

export const generateFeesReport = async ({ academyId, query, user }) => {
  if (user?.role === "assistant_coach") {
    const error = new Error("Assistant coach cannot access fee reports");
    error.statusCode = 403;
    throw error;
  }

  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "paymentDate",
  });

  const payments = await FeePayment.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ paymentDate: -1, createdAt: -1 });

  const rows = payments.map((payment) => ({
    paymentDate: payment.paymentDate || payment.createdAt || "",
    admissionNumber: payment.student?.admissionNumber || "",
    student: `${payment.student?.firstName || ""} ${
      payment.student?.lastName || ""
    }`.trim(),
    branch: payment.branch?.branchName || "",
    amount: payment.amount || 0,
    amountPaid: payment.amountPaid || payment.paidAmount || 0,
    pendingAmount: payment.pendingAmount || 0,
    paymentMode: payment.paymentMode || "",
    status: payment.status || "",
    receiptNumber: payment.receiptNumber || "",
  }));

  return normalizeReportResponse({
    reportType: "fees",
    title: "Fees Report",
    filters: query,
    rows,
    summary: {
      totalRecords: rows.length,
      totalAmount: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      totalPaid: rows.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
      totalPending: rows.reduce(
        (sum, row) => sum + Number(row.pendingAmount || 0),
        0
      ),
    },
    columns: [
      createColumn("paymentDate", "Payment Date"),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("branch", "Branch"),
      createColumn("amount", "Amount"),
      createColumn("amountPaid", "Paid"),
      createColumn("pendingAmount", "Pending"),
      createColumn("paymentMode", "Mode"),
      createColumn("status", "Status"),
      createColumn("receiptNumber", "Receipt No."),
    ],
  });
};

export const generateBeltTestsReport = async ({ academyId, query, user }) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "testDate",
  });

  const records = await BeltTest.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ testDate: -1 });

  const rows = records.map((record) => ({
    testDate: record.testDate || "",
    admissionNumber: record.student?.admissionNumber || "",
    student: `${record.student?.firstName || ""} ${
      record.student?.lastName || ""
    }`.trim(),
    branch: record.branch?.branchName || "",
    oldBeltRank: record.oldBeltRank || record.currentBeltRank || "",
    newBeltRank: record.newBeltRank || record.promotedBeltRank || "",
    result: record.result || record.status || "",
    remarks: record.remarks || "",
  }));

  return normalizeReportResponse({
    reportType: "belt-tests",
    title: "Belt Tests Report",
    filters: query,
    rows,
    summary: {
      totalRecords: rows.length,
      passed: rows.filter((row) => row.result === "passed").length,
      failed: rows.filter((row) => row.result === "failed").length,
    },
    columns: [
      createColumn("testDate", "Test Date"),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("branch", "Branch"),
      createColumn("oldBeltRank", "Old Belt"),
      createColumn("newBeltRank", "New Belt"),
      createColumn("result", "Result"),
      createColumn("remarks", "Remarks"),
    ],
  });
};

export const generateChampionshipsReport = async ({
  academyId,
  query,
  user,
}) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "championshipDate",
  });

  const records = await ChampionshipRecord.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ championshipDate: -1, createdAt: -1 });

  const rows = records.map((record) => ({
    championshipDate: record.championshipDate || record.eventDate || "",
    championshipName: record.championshipName || record.eventName || "",
    admissionNumber: record.student?.admissionNumber || "",
    student: `${record.student?.firstName || ""} ${
      record.student?.lastName || ""
    }`.trim(),
    branch: record.branch?.branchName || "",
    category: record.category || "",
    weightCategory: record.weightCategory || "",
    result: record.result || "",
    medal: record.medal || record.result || "",
  }));

  return normalizeReportResponse({
    reportType: "championships",
    title: "Championships Report",
    filters: query,
    rows,
    summary: {
      totalRecords: rows.length,
      medals: rows.filter((row) => row.medal).length,
    },
    columns: [
      createColumn("championshipDate", "Date"),
      createColumn("championshipName", "Championship"),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("branch", "Branch"),
      createColumn("category", "Category"),
      createColumn("weightCategory", "Weight"),
      createColumn("result", "Result"),
      createColumn("medal", "Medal"),
    ],
  });
};

export const generateCertificatesReport = async ({ academyId, query, user }) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "createdAt",
  });

  const records = await GeneratedCertificate.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ createdAt: -1 });

  const rows = records.map((record) => ({
    generatedAt: record.createdAt || "",
    certificateNumber: record.certificateNumber || "",
    certificateType: record.certificateType || record.type || "",
    admissionNumber: record.student?.admissionNumber || "",
    student: `${record.student?.firstName || ""} ${
      record.student?.lastName || ""
    }`.trim(),
    branch: record.branch?.branchName || "",
    status: record.status || "",
  }));

  return normalizeReportResponse({
    reportType: "certificates",
    title: "Certificates Report",
    filters: query,
    rows,
    summary: {
      totalCertificates: rows.length,
    },
    columns: [
      createColumn("generatedAt", "Generated At"),
      createColumn("certificateNumber", "Certificate No."),
      createColumn("certificateType", "Type"),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("branch", "Branch"),
      createColumn("status", "Status"),
    ],
  });
};

export const generateIdCardsReport = async ({ academyId, query, user }) => {
  const filters = buildReportFilters({
    academyId,
    query,
    user,
    dateField: "createdAt",
  });

  const records = await GeneratedIdCard.find(filters)
    .populate("student", "firstName lastName admissionNumber")
    .populate("branch", "branchName branchCode")
    .lean()
    .sort({ createdAt: -1 });

  const rows = records.map((record) => ({
    generatedAt: record.createdAt || "",
    cardNumber: record.cardNumber || "",
    admissionNumber: record.student?.admissionNumber || "",
    student: `${record.student?.firstName || ""} ${
      record.student?.lastName || ""
    }`.trim(),
    branch: record.branch?.branchName || "",
    status: record.status || "",
  }));

  return normalizeReportResponse({
    reportType: "id-cards",
    title: "ID Cards Report",
    filters: query,
    rows,
    summary: {
      totalIdCards: rows.length,
    },
    columns: [
      createColumn("generatedAt", "Generated At"),
      createColumn("cardNumber", "Card No."),
      createColumn("admissionNumber", "Admission No."),
      createColumn("student", "Student"),
      createColumn("branch", "Branch"),
      createColumn("status", "Status"),
    ],
  });
};

export const generateBranchesReport = async ({ academyId, query, user }) => {
  const filters = {
    academy: objectId(academyId),
  };

  if (query.status === "active") filters.isActive = true;
  if (query.status === "inactive") filters.isActive = false;

  if (user?.role === "assistant_coach") {
    const branches = assistantBranchIds(user);

    filters._id = {
      $in: branches
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => objectId(id)),
    };
  }

  const branches = await Branch.find(filters)
    .populate("manager", "name email phone")
    .populate("coaches", "name email phone")
    .lean()
    .sort({ isMainBranch: -1, branchName: 1 });

  const rows = branches.map((branch) => ({
    branchName: branch.branchName || "",
    branchCode: branch.branchCode || "",
    phone: branch.phone || "",
    email: branch.email || "",
    city: branch.city || "",
    state: branch.state || "",
    manager: branch.manager?.name || "",
    coaches: Array.isArray(branch.coaches)
      ? branch.coaches.map((coach) => coach.name).join(", ")
      : "",
    isMainBranch: branch.isMainBranch ? "Yes" : "No",
    isActive: branch.isActive ? "Active" : "Inactive",
  }));

  return normalizeReportResponse({
    reportType: "branches",
    title: "Branches Report",
    filters: query,
    rows,
    summary: {
      totalBranches: rows.length,
      activeBranches: rows.filter((row) => row.isActive === "Active").length,
      inactiveBranches: rows.filter((row) => row.isActive === "Inactive")
        .length,
    },
    columns: [
      createColumn("branchName", "Branch"),
      createColumn("branchCode", "Code"),
      createColumn("phone", "Phone"),
      createColumn("email", "Email"),
      createColumn("city", "City"),
      createColumn("state", "State"),
      createColumn("manager", "Manager"),
      createColumn("coaches", "Coaches"),
      createColumn("isMainBranch", "Main Branch"),
      createColumn("isActive", "Status"),
    ],
  });
};