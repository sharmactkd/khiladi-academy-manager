import GeneratedIdCard from "../models/GeneratedIdCard.js";
import IdCardTemplate from "../models/IdCardTemplate.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { generateCardNumber } from "../services/numberingService.js";
import { createIdCardTimeline } from "../services/timelineService.js";

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

const validateTemplateAccess = async ({ academyId, templateId }) => {
  return IdCardTemplate.findOne({
    _id: templateId,
    academy: academyId,
    isDeleted: false,
  });
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

  const cardNumber =
    req.body.cardNumber ||
    (await generateCardNumber({
      model: GeneratedIdCard,
      academyId: req.academyId,
    }));

  const qrCodeData =
    req.body.qrCodeData ||
    JSON.stringify({
      type: "student_id_card",
      academy: String(req.academyId),
      student: String(student._id),
      cardNumber,
    });

  const idCard = await GeneratedIdCard.create({
    academy: req.academyId,
    student: student._id,
    template: template._id,
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