import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

import {
  createReportLog,
  generateStudentsReport,
  generateAttendanceReport,
  generateFeesReport,
  generateBeltTestsReport,
  generateChampionshipsReport,
  generateCertificatesReport,
  generateIdCardsReport,
  generateBranchesReport,
} from "../services/reportService.js";

const runReport = async ({
  req,
  res,
  reportType,
  generator,
  successMessage,
}) => {
  try {
    const data = await generator({
      academyId: req.academyId,
      query: req.query,
      user: req.user,
    });

    await createReportLog({
      academyId: req.academyId,
      reportType,
      filters: req.query,
      generatedBy: req.user._id,
      format: req.query.format || "json",
      status: "generated",
      metadata: {
        totalRows: data.totalRows,
      },
    });

    return successResponse(res, successMessage, data);
  } catch (error) {
    await createReportLog({
      academyId: req.academyId,
      reportType,
      filters: req.query,
      generatedBy: req.user._id,
      format: req.query.format || "json",
      status: "failed",
      metadata: {
        error: error.message,
      },
    });

    if (error.statusCode === 403) {
      return errorResponse(res, error.message, 403);
    }

    throw error;
  }
};

export const studentsReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "students",
    generator: generateStudentsReport,
    successMessage: "Students report generated successfully",
  });
});

export const attendanceReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "attendance",
    generator: generateAttendanceReport,
    successMessage: "Attendance report generated successfully",
  });
});

export const feesReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "fees",
    generator: generateFeesReport,
    successMessage: "Fees report generated successfully",
  });
});

export const beltTestsReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "belt-tests",
    generator: generateBeltTestsReport,
    successMessage: "Belt tests report generated successfully",
  });
});

export const championshipsReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "championships",
    generator: generateChampionshipsReport,
    successMessage: "Championships report generated successfully",
  });
});

export const certificatesReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "certificates",
    generator: generateCertificatesReport,
    successMessage: "Certificates report generated successfully",
  });
});

export const idCardsReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "id-cards",
    generator: generateIdCardsReport,
    successMessage: "ID cards report generated successfully",
  });
});

export const branchesReport = asyncHandler(async (req, res) => {
  return runReport({
    req,
    res,
    reportType: "branches",
    generator: generateBranchesReport,
    successMessage: "Branches report generated successfully",
  });
});