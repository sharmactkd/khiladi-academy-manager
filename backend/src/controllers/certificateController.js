import GeneratedCertificate from "../models/GeneratedCertificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Student from "../models/Student.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { generateCertificateNumber } from "../services/numberingService.js";
import { createCertificateTimeline } from "../services/timelineService.js";

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

const validateTemplateAccess = async ({ academyId, templateId }) => {
  return CertificateTemplate.findOne({
    _id: templateId,
    academy: academyId,
    isDeleted: false,
  });
};

const validateRelatedRecords = async ({
  academyId,
  relatedBeltTest,
  relatedChampionshipRecord,
}) => {
  if (relatedBeltTest) {
    const beltTest = await BeltTest.findOne({
      _id: relatedBeltTest,
      academy: academyId,
      isDeleted: false,
    });

    if (!beltTest) {
      return {
        valid: false,
        message: "Related belt test not found in your academy",
      };
    }
  }

  if (relatedChampionshipRecord) {
    const championshipRecord = await ChampionshipRecord.findOne({
      _id: relatedChampionshipRecord,
      academy: academyId,
      isDeleted: false,
    });

    if (!championshipRecord) {
      return {
        valid: false,
        message: "Related championship record not found in your academy",
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
};

export const generateCertificate = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.body.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const template = await validateTemplateAccess({
    academyId: req.academyId,
    templateId: req.body.template,
  });

  if (!template) {
    return errorResponse(
      res,
      "Certificate template not found in your academy",
      404
    );
  }

  const relatedValidation = await validateRelatedRecords({
    academyId: req.academyId,
    relatedBeltTest: req.body.relatedBeltTest,
    relatedChampionshipRecord: req.body.relatedChampionshipRecord,
  });

  if (!relatedValidation.valid) {
    return errorResponse(res, relatedValidation.message, 404);
  }

  const certificateNumber =
    req.body.certificateNumber ||
    (await generateCertificateNumber({
      model: GeneratedCertificate,
      academyId: req.academyId,
    }));

  const certificate = await GeneratedCertificate.create({
    academy: req.academyId,
    student: student._id,
    template: template._id,
    certificateType: req.body.certificateType,
    certificateNumber,
    issueDate: req.body.issueDate || new Date(),
    relatedBeltTest: req.body.relatedBeltTest || null,
    relatedChampionshipRecord: req.body.relatedChampionshipRecord || null,
    status: "issued",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createCertificateTimeline({
    certificate,
    userId: req.user._id,
  });

  const populatedCertificate = await GeneratedCertificate.findById(
    certificate._id
  )
    .populate("student", "name studentCode phone beltRank photo status dob")
    .populate("template")
    .populate("relatedBeltTest")
    .populate("relatedChampionshipRecord");

  return successResponse(res, "Certificate generated successfully", {
    certificate: populatedCertificate,
  }, 201);
});

export const getStudentCertificates = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const certificates = await GeneratedCertificate.find({
    academy: req.academyId,
    student: req.params.studentId,
  })
    .sort({ issueDate: -1, createdAt: -1 })
    .populate("template")
    .populate("relatedBeltTest")
    .populate("relatedChampionshipRecord");

  return successResponse(res, "Student certificates fetched successfully", {
    student,
    certificates,
  });
});

export const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await GeneratedCertificate.findOne({
    _id: req.params.id,
    academy: req.academyId,
  })
    .populate("student", "name studentCode phone beltRank photo status dob")
    .populate("template")
    .populate("relatedBeltTest")
    .populate("relatedChampionshipRecord")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!certificate) {
    return errorResponse(res, "Certificate not found", 404);
  }

  return successResponse(res, "Certificate fetched successfully", {
    certificate,
  });
});

export const updateCertificateStatus = asyncHandler(async (req, res) => {
  const certificate = await GeneratedCertificate.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!certificate) {
    return errorResponse(res, "Certificate not found", 404);
  }

  certificate.status = req.body.status;
  certificate.updatedBy = req.user._id;

  await certificate.save();

  return successResponse(res, "Certificate status updated successfully", {
    certificate,
  });
});