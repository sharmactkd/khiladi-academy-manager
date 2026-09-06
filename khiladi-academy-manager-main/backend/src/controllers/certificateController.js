import crypto from "crypto";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Student from "../models/Student.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import Academy from "../models/Academy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { generateCertificateNumber } from "../services/numberingService.js";
import { createCertificateTimeline } from "../services/timelineService.js";

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  })
    .populate("branch", "branchName address city state country")
    .populate("batch", "batchName martialArt");
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
  studentId,
  relatedBeltTest,
  relatedChampionshipRecord,
}) => {
  let beltTest = null;
  let championshipRecord = null;

  if (relatedBeltTest) {
    beltTest = await BeltTest.findOne({
      _id: relatedBeltTest,
      academy: academyId,
      student: studentId,
      isDeleted: false,
    }).lean();

    if (!beltTest) {
      return {
        valid: false,
        message: "Related belt test does not belong to the selected student",
      };
    }
  }

  if (relatedChampionshipRecord) {
    championshipRecord = await ChampionshipRecord.findOne({
      _id: relatedChampionshipRecord,
      academy: academyId,
      student: studentId,
      isDeleted: false,
    }).lean();

    if (!championshipRecord) {
      return {
        valid: false,
        message: "Related championship record does not belong to the selected student",
      };
    }
  }

  return {
    valid: true,
    message: "",
    beltTest,
    championshipRecord,
  };
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildVerificationUrl = ({ verificationId, token }) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${clientUrl}/verify/certificate/${verificationId}?token=${token}`;
};

const buildStudentSnapshot = (student) => ({
  name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
  firstName: student.firstName || "",
  lastName: student.lastName || "",
  admissionNumber: student.admissionNumber || student.studentCode || "",
  studentCode: student.studentCode || "",
  beltRank: student.beltRank || "",
  danRank: student.danRank || "",
  martialArt: student.martialArt || student.batch?.martialArt || "",
  dateOfBirth: student.dateOfBirth || student.dob || null,
  branch: student.branch ? { branchName: student.branch.branchName || "" } : null,
  batch: student.batch ? { batchName: student.batch.batchName || "" } : null,
});

const buildAcademySnapshot = (academy) => ({
  academyName: academy?.academyName || academy?.name || "",
  logo: academy?.logo || "",
  address: academy?.address || "",
  city: academy?.city || "",
  state: academy?.state || "",
  country: academy?.country || "",
  ownerName: academy?.ownerName || "",
});

const buildSourceSnapshot = ({ beltTest, championshipRecord }) => {
  if (beltTest) {
    return {
      kind: "belt_test",
      recordId: beltTest._id,
      currentBelt: beltTest.currentBelt || "",
      currentDanRank: beltTest.currentDanRank || "",
      promotedToBelt: beltTest.promotedToBelt || "",
      promotedToDanRank: beltTest.promotedToDanRank || "",
      testDate: beltTest.testDate || null,
      examinerName: beltTest.examinerName || "",
      result: beltTest.result || "",
    };
  }

  if (championshipRecord) {
    return {
      kind: "championship",
      recordId: championshipRecord._id,
      championshipName: championshipRecord.championshipName || "",
      result: championshipRecord.result || "",
      level: championshipRecord.level || "",
      eventType: championshipRecord.eventType || "",
      ageCategory: championshipRecord.ageCategory || "",
      weightCategory: championshipRecord.weightCategory || "",
      startDate: championshipRecord.startDate || null,
    };
  }

  return { kind: "manual" };
};

const sanitizeContent = (content = {}) => Object.fromEntries(
  Object.entries(content).filter(([, value]) => value !== "" && value !== null && value !== undefined)
);

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
    studentId: student._id,
    relatedBeltTest: req.body.relatedBeltTest,
    relatedChampionshipRecord: req.body.relatedChampionshipRecord,
  });

  if (!relatedValidation.valid) {
    return errorResponse(res, relatedValidation.message, 404);
  }

  const academy = await Academy.findById(req.academyId).lean();
  const certificateType = template.certificateType || req.body.certificateType;

  if (certificateType === "belt" && relatedValidation.beltTest && relatedValidation.beltTest.result !== "pass") {
    return errorResponse(res, "Only a passed belt test can be linked to a belt promotion certificate", 400);
  }

  const certificateNumber =
    req.body.certificateNumber ||
    (await generateCertificateNumber({
      model: GeneratedCertificate,
      academyId: req.academyId,
    }));

  const verificationId = crypto.randomBytes(12).toString("hex");
  const verificationToken = crypto.randomBytes(24).toString("hex");
  const qrCodeData = buildVerificationUrl({ verificationId, token: verificationToken });

  const certificate = await GeneratedCertificate.create({
    academy: req.academyId,
    student: student._id,
    template: template._id,
    certificateType,
    templateVersion: template.version || 1,
    templateSnapshot: template.toObject(),
    studentSnapshot: buildStudentSnapshot(student),
    academySnapshot: buildAcademySnapshot(academy),
    sourceSnapshot: buildSourceSnapshot(relatedValidation),
    contentSnapshot: sanitizeContent(req.body.content),
    verificationId,
    verificationTokenHash: hashToken(verificationToken),
    qrCodeData,
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
    .populate("student", "name firstName lastName admissionNumber studentCode phone beltRank danRank profilePhoto photo status dob")
    .populate("template")
    .populate("relatedBeltTest")
    .populate("relatedChampionshipRecord");

  return successResponse(res, "Certificate generated successfully", {
    certificate: populatedCertificate,
  }, 201);
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.verificationId || "")) {
    return errorResponse(res, "Certificate verification failed", 400);
  }

  const token = String(req.query.token || "");
  if (!token) return errorResponse(res, "Verification token is required", 400);

  const certificate = await GeneratedCertificate.findOne({
    verificationId: req.params.verificationId,
  }).select("+verificationTokenHash");

  if (!certificate?.verificationTokenHash) {
    return errorResponse(res, "Certificate verification failed", 404);
  }

  const received = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(certificate.verificationTokenHash, "hex");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return errorResponse(res, "Certificate verification failed", 403);
  }

  return successResponse(res, "Certificate verified successfully", {
    certificateNumber: certificate.certificateNumber,
    certificateType: certificate.certificateType,
    issueDate: certificate.issueDate,
    status: certificate.status,
    student: {
      name: certificate.studentSnapshot?.name || "",
      admissionNumber: certificate.studentSnapshot?.admissionNumber || "",
    },
    academy: {
      name: certificate.academySnapshot?.academyName || "",
      logo: certificate.academySnapshot?.logo || "",
    },
    source: certificate.sourceSnapshot || {},
    title: certificate.contentSnapshot?.title || "",
  });
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
    .populate("student", "name firstName lastName admissionNumber studentCode phone beltRank danRank profilePhoto photo status dob")
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
