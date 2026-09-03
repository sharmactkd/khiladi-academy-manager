import mongoose from "mongoose";

import FeePayment from "../models/FeePayment.js";
import MembershipAdjustment from "../models/MembershipAdjustment.js";
import Student from "../models/Student.js";
import StudentMembership from "../models/StudentMembership.js";

const MEMBERSHIP_FIELDS = [
  "status",
  "startDate",
  "originalDueDate",
  "effectiveDueDate",
  "remainingTrainingDays",
  "unpaidMonths",
  "feeRequired",
  "feeStatus",
  "internalNote",
];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const clean = (value) => String(value ?? "").trim();

const parseDate = (value, fieldName) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(`${fieldName} is invalid`);
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const boundedInteger = (value, fieldName, min, max) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw createError(`${fieldName} must be between ${min} and ${max}`);
  }
  return number;
};

const addDays = (value, days) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const snapshot = (membership) =>
  MEMBERSHIP_FIELDS.reduce((result, field) => {
    result[field] = membership[field] ?? null;
    return result;
  }, {});

export const serializeMembership = (membership) => {
  if (!membership) return null;
  const source = typeof membership.toObject === "function" ? membership.toObject() : membership;
  return {
    _id: source._id,
    student: source.student,
    batch: source.batch,
    status: source.status,
    startDate: source.startDate,
    originalDueDate: source.originalDueDate,
    effectiveDueDate: source.effectiveDueDate,
    remainingTrainingDays: Number(source.remainingTrainingDays || 0),
    unpaidMonths: Number(source.unpaidMonths || 0),
    feeRequired: source.feeRequired !== false,
    feeStatus: source.feeStatus,
    internalNote: source.internalNote || "",
    lastAdjustedAt: source.lastAdjustedAt,
    lastAdjustedBy: source.lastAdjustedBy,
    version: Number(source.__v || 0),
  };
};

const findStudent = async ({ academyId, studentId }) => {
  if (!mongoose.Types.ObjectId.isValid(String(studentId || ""))) {
    throw createError("Invalid student ID");
  }
  const student = await Student.findOne({ _id: studentId, academy: academyId });
  if (!student) throw createError("Student not found", 404);
  return student;
};

export const getOrCreateMembership = async ({ academyId, studentId }) => {
  const student = await findStudent({ academyId, studentId });
  let membership = await StudentMembership.findOne({ academy: academyId, student: studentId });
  if (membership) return membership;

  const latestFee = await FeePayment.findOne({
    academy: academyId,
    student: studentId,
    status: { $ne: "cancelled" },
  }).sort({ paymentDate: -1, createdAt: -1 });

  const initialDueDate = latestFee?.dueDate || student.joiningDate || student.createdAt || null;
  try {
    membership = await StudentMembership.create({
      academy: academyId,
      student: studentId,
      batch: student.batch || null,
      status: student.status === "active" ? "active" : "paused",
      startDate: student.joiningDate || student.createdAt || null,
      originalDueDate: initialDueDate,
      effectiveDueDate: initialDueDate,
      feeStatus: latestFee?.status || "due",
      feeRequired: true,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    membership = await StudentMembership.findOne({ academy: academyId, student: studentId });
  }
  return membership;
};

export const getStudentMembership = async ({ academyId, studentId }) => {
  const membership = await getOrCreateMembership({ academyId, studentId });
  const adjustments = await MembershipAdjustment.find({
    academy: academyId,
    student: studentId,
  })
    .populate("createdBy", "name role")
    .populate("reversedBy", "name role")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return { membership: serializeMembership(membership), adjustments };
};

export const getMembershipMap = async ({ academyId, studentIds = [] }) => {
  if (!studentIds.length) return new Map();
  const memberships = await StudentMembership.find({
    academy: academyId,
    student: { $in: studentIds },
  }).lean();
  return new Map(
    memberships.map((membership) => [
      String(membership.student),
      serializeMembership(membership),
    ])
  );
};

export const applyMembershipAdjustment = async ({
  academyId,
  studentId,
  userId,
  payload = {},
}) => {
  const type = clean(payload.type).toLowerCase();
  const reason = clean(payload.reason);
  const note = clean(payload.note);

  const membership = await getOrCreateMembership({ academyId, studentId });
  if (payload.expectedVersion !== undefined && Number(payload.expectedVersion) !== membership.__v) {
    throw createError("Membership was updated elsewhere. Refresh and try again.", 409);
  }

  const previousState = snapshot(membership);
  let days = 0;
  let months = 0;

  switch (type) {
    case "extend_days":
      days = boundedInteger(payload.days, "Days", 1, 3650);
      membership.effectiveDueDate = addDays(membership.effectiveDueDate || membership.originalDueDate, days);
      break;
    case "reduce_days":
      days = boundedInteger(payload.days, "Days", 1, 3650);
      membership.effectiveDueDate = addDays(membership.effectiveDueDate || membership.originalDueDate, -days);
      break;
    case "set_due_date":
      membership.effectiveDueDate = parseDate(payload.dueDate, "Due date");
      break;
    case "set_remaining_days":
      membership.remainingTrainingDays = boundedInteger(payload.remainingTrainingDays, "Remaining days", 0, 3650);
      break;
    case "change_unpaid_months":
      months = boundedInteger(payload.months, "Month adjustment", -120, 120);
      membership.unpaidMonths = Math.max(0, Number(membership.unpaidMonths || 0) + months);
      break;
    case "pause":
      membership.status = "paused";
      break;
    case "resume": {
      membership.status = "active";
      if (payload.resumeDate && Number(membership.remainingTrainingDays || 0) > 0) {
        const resumeDate = parseDate(payload.resumeDate, "Resume date");
        membership.effectiveDueDate = addDays(resumeDate, membership.remainingTrainingDays);
        membership.remainingTrainingDays = 0;
      }
      break;
    }
    case "set_fee_status": {
      const allowed = ["paid", "due", "partial", "overdue", "waived", "complimentary"];
      const feeStatus = clean(payload.feeStatus).toLowerCase();
      if (!allowed.includes(feeStatus)) throw createError("Fee status is invalid");
      membership.feeStatus = feeStatus;
      membership.feeRequired = !["waived", "complimentary"].includes(feeStatus);
      if (feeStatus === "complimentary") membership.status = "complimentary";
      else if (membership.status === "complimentary") membership.status = "active";
      if (feeStatus === "paid") membership.unpaidMonths = 0;
      break;
    }
    case "set_note":
      membership.internalNote = clean(payload.internalNote ?? payload.note);
      break;
    default:
      throw createError("Unsupported membership adjustment type");
  }

  if (type !== "set_note" && payload.internalNote !== undefined) {
    membership.internalNote = clean(payload.internalNote);
  }
  membership.lastAdjustedAt = new Date();
  membership.lastAdjustedBy = userId;
  await membership.save();

  const adjustment = await MembershipAdjustment.create({
    academy: academyId,
    student: studentId,
    membership: membership._id,
    type,
    days,
    months,
    reason,
    note,
    previousState,
    nextState: snapshot(membership),
    createdBy: userId,
  });

  return { membership: serializeMembership(membership), adjustment };
};

export const reverseMembershipAdjustment = async ({ academyId, adjustmentId, userId, reason }) => {
  const reversalReason = clean(reason);
  if (!reversalReason) throw createError("Reversal reason is required");
  const adjustment = await MembershipAdjustment.findOne({ _id: adjustmentId, academy: academyId });
  if (!adjustment) throw createError("Adjustment not found", 404);
  if (adjustment.reversedAt || adjustment.type === "reversal") throw createError("Adjustment is already reversed");

  const latest = await MembershipAdjustment.findOne({
    membership: adjustment.membership,
    reversedAt: null,
    type: { $ne: "reversal" },
  }).sort({ createdAt: -1 });
  if (!latest || String(latest._id) !== String(adjustment._id)) {
    throw createError("Only the latest adjustment can be reversed", 409);
  }

  const membership = await StudentMembership.findOne({ _id: adjustment.membership, academy: academyId });
  if (!membership) throw createError("Membership not found", 404);
  const currentState = snapshot(membership);
  MEMBERSHIP_FIELDS.forEach((field) => { membership[field] = adjustment.previousState?.[field] ?? null; });
  membership.lastAdjustedAt = new Date();
  membership.lastAdjustedBy = userId;
  await membership.save();

  adjustment.reversedAt = new Date();
  adjustment.reversedBy = userId;
  await adjustment.save();

  await MembershipAdjustment.create({
    academy: academyId,
    student: adjustment.student,
    membership: membership._id,
    type: "reversal",
    reason: reversalReason,
    note: `Reversed adjustment ${adjustment._id}`,
    previousState: currentState,
    nextState: snapshot(membership),
    createdBy: userId,
    reversalOf: adjustment._id,
  });

  return serializeMembership(membership);
};
