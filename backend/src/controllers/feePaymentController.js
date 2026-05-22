import FeePayment from "../models/FeePayment.js";
import FeePlan from "../models/FeePlan.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const safeFields = [
  "student",
  "feePlan",
  "amount",
  "discount",
  "month",
  "dueDate",
  "paidDate",
  "status",
  "paymentMode",
  "receiptNumber",
  "note",
];

const buildPayload = (body) => {
  const payload = {};
  safeFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] || undefined;
    }
  });
  return payload;
};

const generateReceiptNumber = async (academyId) => {
  const prefix = `RCPT-${new Date().getFullYear()}`;
  const count = await FeePayment.countDocuments({ academy: academyId });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

const validateStudent = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

const validateFeePlan = async ({ academyId, feePlanId }) => {
  if (!feePlanId) return null;

  return FeePlan.findOne({
    _id: feePlanId,
    academy: academyId,
  });
};

export const createFeePayment = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  const student = await validateStudent({
    academyId: req.academyId,
    studentId: payload.student,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  if (payload.feePlan) {
    const feePlan = await validateFeePlan({
      academyId: req.academyId,
      feePlanId: payload.feePlan,
    });

    if (!feePlan) {
      return errorResponse(res, "Fee plan not found in your academy", 404);
    }
  }

  if (!payload.receiptNumber) {
    payload.receiptNumber = await generateReceiptNumber(req.academyId);
  }

  const feePayment = await FeePayment.create({
    ...payload,
    academy: req.academyId,
    collectedBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(
    res,
    "Fee payment created successfully",
    { feePayment },
    201
  );
});

export const getFeePayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.academyId) filter.academy = req.academyId;

  if (req.query.student) filter.student = req.query.student;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.month) filter.month = req.query.month;

  const feePayments = await FeePayment.find(filter)
    .sort({ createdAt: -1 })
    .populate("student", "name studentCode phone batch")
    .populate("feePlan", "name amount billingCycle");

  return successResponse(res, "Fee payments fetched successfully", {
    feePayments,
  });
});

export const getStudentFeePayments = asyncHandler(async (req, res) => {
  const student = await validateStudent({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const feePayments = await FeePayment.find({
    academy: req.academyId,
    student: student._id,
  })
    .sort({ createdAt: -1 })
    .populate("feePlan", "name amount billingCycle");

  return successResponse(res, "Student fee history fetched successfully", {
    student,
    feePayments,
  });
});

export const getFeePaymentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePayment = await FeePayment.findOne(filter)
    .populate("student", "name studentCode phone parentName parentPhone")
    .populate("feePlan", "name amount billingCycle");

  if (!feePayment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  return successResponse(res, "Fee payment fetched successfully", {
    feePayment,
  });
});

export const updateFeePayment = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePayment = await FeePayment.findOne(filter);

  if (!feePayment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  const payload = buildPayload(req.body);

  if (payload.student) {
    const student = await validateStudent({
      academyId: feePayment.academy,
      studentId: payload.student,
    });

    if (!student) {
      return errorResponse(res, "Student not found in your academy", 404);
    }
  }

  if (payload.feePlan) {
    const feePlan = await validateFeePlan({
      academyId: feePayment.academy,
      feePlanId: payload.feePlan,
    });

    if (!feePlan) {
      return errorResponse(res, "Fee plan not found in your academy", 404);
    }
  }

  Object.assign(feePayment, payload, {
    updatedBy: req.user._id,
  });

  await feePayment.save();

  return successResponse(res, "Fee payment updated successfully", {
    feePayment,
  });
});

export const deleteFeePayment = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.academyId) filter.academy = req.academyId;

  const feePayment = await FeePayment.findOne(filter);

  if (!feePayment) {
    return errorResponse(res, "Fee payment not found", 404);
  }

  feePayment.status = "cancelled";
  feePayment.updatedBy = req.user._id;
  await feePayment.save();

  return successResponse(res, "Fee payment cancelled successfully", {
    feePayment,
  });
});