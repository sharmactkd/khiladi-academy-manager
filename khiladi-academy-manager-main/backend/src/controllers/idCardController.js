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

const createIdCardRecord = async ({ academyId, userId, student, template, academy, payload = {} }) => {
  const cardNumber = payload.cardNumber || (await generateCardNumber({
    model: GeneratedIdCard,
    academyId,
  }));
  const verificationId = crypto.randomBytes(12).toString("hex");
  const verificationToken = crypto.randomBytes(24).toString("hex");
  const qrCodeData = buildVerificationUrl({ verificationId, token: verificationToken });

  const idCard = await GeneratedIdCard.create({
    academy: academyId,
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
    issuedDate: payload.issuedDate || new Date(),
    validTill: payload.validTill || null,
    status: "active",
    createdBy: userId,
    updatedBy: userId,
  });

  await createIdCardTimeline({ idCard, userId });
  return GeneratedIdCard.findById(idCard._id)
    .populate("student", "name firstName lastName admissionNumber studentCode phone beltRank profilePhoto photo status dateOfBirth dob")
    .populate("template");
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

  const populatedIdCard = await createIdCardRecord({
    academyId: req.academyId,
    userId: req.user._id,
    student,
    template,
    academy,
    payload: req.body,
  });

  return successResponse(res, "ID card generated successfully", {
    idCard: populatedIdCard,
  }, 201);
});

export const generateIdCardsBulk = asyncHandler(async (req, res) => {
  const studentIds = [...new Set((req.body.students || []).map(String))].slice(0, 100);
  if (!studentIds.length) return errorResponse(res, "Select at least one student", 400);

  const template = await validateTemplateAccess({ academyId: req.academyId, templateId: req.body.template });
  if (!template) return errorResponse(res, "ID card template not found in your academy", 404);

  const students = await Student.find({ _id: { $in: studentIds }, academy: req.academyId })
    .populate("branch", "branchName address city state country")
    .populate("batch", "batchName martialArt");
  if (students.length !== studentIds.length) return errorResponse(res, "One or more students were not found", 400);

  const studentMap = new Map(students.map((student) => [String(student._id), student]));
  const academy = await Academy.findById(req.academyId).lean();
  const idCards = [];

  for (const studentId of studentIds) {
    const idCard = await createIdCardRecord({
      academyId: req.academyId,
      userId: req.user._id,
      student: studentMap.get(studentId),
      template,
      academy,
      payload: req.body,
    });
    idCards.push(idCard);
  }

  return successResponse(res, `${idCards.length} ID cards generated successfully`, { idCards }, 201);
});

export const getIdCardsBatch = asyncHandler(async (req, res) => {
  const ids = [...new Set(String(req.query.ids || "").split(",").map((id) => id.trim()).filter(Boolean))].slice(0, 100);
  if (!ids.length || ids.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
    return errorResponse(res, "Valid ID card IDs are required", 400);
  }
  const idCards = await GeneratedIdCard.find({ _id: { $in: ids }, academy: req.academyId })
    .populate("student", "name firstName lastName admissionNumber studentCode phone beltRank profilePhoto photo status dateOfBirth dob")
    .populate("template");
  const map = new Map(idCards.map((card) => [String(card._id), card]));
  return successResponse(res, "ID cards fetched successfully", { idCards: ids.map((id) => map.get(id)).filter(Boolean) });
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
