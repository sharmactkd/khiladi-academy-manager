import crypto from "crypto";
import GeneratedIdCard from "../models/GeneratedIdCard.js";
import IdCardTemplate from "../models/IdCardTemplate.js";
import Student from "../models/Student.js";
import Academy from "../models/Academy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { generateCardNumber } from "../services/numberingService.js";
import { createIdCardTimeline } from "../services/timelineService.js";

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  })
    .populate("branch", "branchName address city state country")
    .populate("batch", "batchName martialArt");
};

const validateTemplateAccess = async ({ academyId, templateId }) => {
  return IdCardTemplate.findOne({
    _id: templateId,
    academy: academyId,
    isDeleted: false,
  });
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildStudentSnapshot = (student) => ({
  name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
  firstName: student.firstName || "",
  lastName: student.lastName || "",
  admissionNumber: student.admissionNumber || student.studentCode || "",
  studentCode: student.studentCode || "",
  phone: student.phone || "",
  beltRank: student.beltRank || "",
  danRank: student.danRank || "",
  martialArt: student.martialArt || student.batch?.martialArt || "",
  profilePhoto: student.profilePhoto || student.photo || "",
  branch: student.branch ? { branchName: student.branch.branchName || "" } : null,
  batch: student.batch ? { batchName: student.batch.batchName || "", martialArt: student.batch.martialArt || "" } : null,
});

const buildAcademySnapshot = (academy) => ({
  academyName: academy?.academyName || academy?.name || "",
  logo: academy?.logo || "",
  address: academy?.address || "",
  city: academy?.city || "",
  state: academy?.state || "",
  country: academy?.country || "",
});

const buildVerificationUrl = ({ verificationId, token }) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${clientUrl}/verify/id-card/${verificationId}?token=${token}`;
};

export const generateIdCard = asyncHandler(async (req, res) => {
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
    return errorResponse(res, "ID card template not found in your academy", 404);
  }

  const academy = await Academy.findById(req.academyId).lean();

  const cardNumber =
    req.body.cardNumber ||
    (await generateCardNumber({
      model: GeneratedIdCard,
      academyId: req.academyId,
    }));

  const verificationId = crypto.randomBytes(12).toString("hex");
  const verificationToken = crypto.randomBytes(24).toString("hex");
  const qrCodeData = buildVerificationUrl({ verificationId, token: verificationToken });

  const idCard = await GeneratedIdCard.create({
    academy: req.academyId,
    student: student._id,
    template: template._id,
    templateVersion: template.version || 1,
    templateSnapshot: template.toObject(),
    studentSnapshot: buildStudentSnapshot(student),
    academySnapshot: buildAcademySnapshot(academy),
    verificationId,
    verificationTokenHash: hashToken(verificationToken),
    cardNumber,
    qrCodeData,
    issuedDate: req.body.issuedDate || new Date(),
    validTill: req.body.validTill || null,
    status: "active",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createIdCardTimeline({
    idCard,
    userId: req.user._id,
  });

  const populatedIdCard = await GeneratedIdCard.findById(idCard._id)
    .populate(
  "student",
  "name firstName lastName admissionNumber studentCode phone beltRank profilePhoto photo status dateOfBirth dob"
)
    .populate("template");

  return successResponse(res, "ID card generated successfully", {
    idCard: populatedIdCard,
  }, 201);
});

export const verifyIdCard = asyncHandler(async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.verificationId || "")) {
    return errorResponse(res, "ID card verification failed", 400);
  }
  const token = String(req.query.token || "");
  if (!token) return errorResponse(res, "Verification token is required", 400);

  const idCard = await GeneratedIdCard.findOne({
    verificationId: req.params.verificationId,
  }).select("+verificationTokenHash");

  if (!idCard || !idCard.verificationTokenHash) {
    return errorResponse(res, "ID card verification failed", 404);
  }

  const received = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(idCard.verificationTokenHash, "hex");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return errorResponse(res, "ID card verification failed", 403);
  }

  const resolvedStatus =
    idCard.status === "active" && idCard.validTill && new Date(idCard.validTill) < new Date()
      ? "expired"
      : idCard.status;

  return successResponse(res, "ID card verified successfully", {
    cardNumber: idCard.cardNumber,
    issuedDate: idCard.issuedDate,
    validTill: idCard.validTill,
    status: resolvedStatus,
    student: {
      name: idCard.studentSnapshot?.name || `${idCard.studentSnapshot?.firstName || ""} ${idCard.studentSnapshot?.lastName || ""}`.trim(),
      admissionNumber: idCard.studentSnapshot?.admissionNumber || idCard.studentSnapshot?.studentCode || "",
      photo: idCard.studentSnapshot?.profilePhoto || idCard.studentSnapshot?.photo || "",
    },
    academy: {
      name: idCard.academySnapshot?.academyName || idCard.academySnapshot?.name || "",
      logo: idCard.academySnapshot?.logo || "",
    },
  });
});

export const getStudentIdCards = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  const idCards = await GeneratedIdCard.find({
  academy: req.academyId,
  student: req.params.studentId,
})
  .sort({ issuedDate: -1, createdAt: -1 })
  .populate(
    "student",
    "name firstName lastName admissionNumber studentCode phone beltRank profilePhoto photo status dateOfBirth dob"
  )
  .populate("template");

  return successResponse(res, "Student ID cards fetched successfully", {
    student,
    idCards,
  });
});

export const getIdCardById = asyncHandler(async (req, res) => {
  const idCard = await GeneratedIdCard.findOne({
    _id: req.params.id,
    academy: req.academyId,
  })
    .populate(
  "student",
  "name firstName lastName admissionNumber studentCode phone beltRank profilePhoto photo status dateOfBirth dob"
)
    .populate("template")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!idCard) {
    return errorResponse(res, "ID card not found", 404);
  }

  return successResponse(res, "ID card fetched successfully", { idCard });
});

export const updateIdCardStatus = asyncHandler(async (req, res) => {
  const idCard = await GeneratedIdCard.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!idCard) {
    return errorResponse(res, "ID card not found", 404);
  }

  idCard.status = req.body.status;
  idCard.updatedBy = req.user._id;

  await idCard.save();

  return successResponse(res, "ID card status updated successfully", {
    idCard,
  });
});
