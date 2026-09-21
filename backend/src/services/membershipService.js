import mongoose from "mongoose";

import FeePayment from "../models/FeePayment.js";
import MembershipAdjustment from "../models/MembershipAdjustment.js";
import Student from "../models/Student.js";
import StudentMembership from "../models/StudentMembership.js";
import { calculateMembershipAccrualState } from "../utils/membershipMonthlyDue.js";
import { resolveFeeStatus } from "../utils/feeStatus.js";
import { queueFeeIntegritySync } from "./automaticFeeIntegrityService.js";

const MEMBERSHIP_FIELDS = [
  "status",
  "startDate",
  "originalDueDate",
  "effectiveDueDate",
  "nextDueDate",
  "pausedAt",
  "remainingTrainingDays",
  "unpaidMonths",
  "unpaidDays",
  "autoMonthlyDue",
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

export const parseMembershipDate = (value, fieldName) => {
  if (!value) return null;

  const raw = String(value).trim();
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(Date.UTC(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      ))
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createError(`${fieldName} is invalid`);
  }

  if (dateOnlyMatch && (
    date.getUTCFullYear() !== Number(dateOnlyMatch[1]) ||
    date.getUTCMonth() !== Number(dateOnlyMatch[2]) - 1 ||
    date.getUTCDate() !== Number(dateOnlyMatch[3])
  )) {
    throw createError(`${fieldName} is invalid`);
  }

  // Membership due/resume dates are calendar dates, not moments in the
  // server's timezone. UTC normalization prevents 01-09 becoming 31-08.
  date.setUTCHours(0, 0, 0, 0);
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
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const moveDueDateToNextCycle = (value, now = new Date()) => {
  const source = value ? new Date(value) : new Date(now);
  if (Number.isNaN(source.getTime())) return null;
  const dueDay = source.getUTCDate();
  let year = source.getUTCFullYear();
  let month = source.getUTCMonth();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let candidate;
  do {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    candidate = new Date(Date.UTC(year, month, Math.min(dueDay, lastDay)));
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  } while (candidate <= today);
  return candidate;
};

const snapshot = (membership) =>
  MEMBERSHIP_FIELDS.reduce((result, field) => {
    result[field] = membership[field] ?? null;
    return result;
  }, {});

export const serializeMembership = (membership) => {
  if (!membership) return null;
  const source = typeof membership.toObject === "function" ? membership.toObject() : membership;
  const accrual = calculateMembershipAccrualState(source);
  const unpaidMonths = accrual.unpaidMonths;
  const displayedDueDate = unpaidMonths > 0 || Number(source.unpaidDays || 0) > 0
    ? source.effectiveDueDate || source.nextDueDate
    : accrual.nextDueDate || source.nextDueDate || source.effectiveDueDate;
  const feeStatusSummary = resolveFeeStatus({
    membership: { ...source, unpaidMonths },
    fallbackStatus: source.feeStatus || "due",
  });
  return {
    _id: source._id,
    student: source.student,
    batch: source.batch,
    status: source.status,
    startDate: source.startDate,
    originalDueDate: source.originalDueDate,
    effectiveDueDate: displayedDueDate,
    nextDueDate: accrual.nextDueDate || source.nextDueDate || source.effectiveDueDate,
    pausedAt: source.pausedAt || null,
    remainingTrainingDays: Number(source.remainingTrainingDays || 0),
    unpaidMonths,
    unpaidDays: Number(source.unpaidDays || 0),
    feeRequired: source.feeRequired !== false,
    feeStatus: feeStatusSummary.code,
    feeStatusSummary,
    autoMonthlyDue: source.autoMonthlyDue === true,
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
      nextDueDate: initialDueDate,
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
  const storedMonthsBeforeAccrual = Math.max(0, Number(membership.unpaidMonths || 0));
  const accrualStartDate = membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate;
  const currentAccrual = calculateMembershipAccrualState(membership);
  membership.unpaidMonths = currentAccrual.unpaidMonths;
  if (currentAccrual.nextDueDate) {
    membership.nextDueDate = currentAccrual.nextDueDate;
  }
  if (
    storedMonthsBeforeAccrual === 0 &&
    currentAccrual.accruedCycles > 0 &&
    accrualStartDate
  ) {
    membership.effectiveDueDate = accrualStartDate;
  }
  let days = 0;
  let months = 0;

  switch (type) {
    case "extend_days":
      days = boundedInteger(payload.days, "Days", 1, 3650);
      membership.nextDueDate = addDays(membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate, days);
      membership.effectiveDueDate = membership.nextDueDate;
      break;
    case "reduce_days":
      days = boundedInteger(payload.days, "Days", 1, 3650);
      membership.nextDueDate = addDays(membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate, -days);
      membership.effectiveDueDate = membership.nextDueDate;
      break;
    case "set_due_date":
      membership.effectiveDueDate = parseMembershipDate(payload.dueDate, "Due date");
      membership.nextDueDate = membership.effectiveDueDate;
      membership.autoMonthlyDue = true;
      break;
    case "set_remaining_days":
      membership.remainingTrainingDays = boundedInteger(payload.remainingTrainingDays, "Remaining days", 0, 3650);
      break;
    case "change_unpaid_months":
      months = boundedInteger(payload.months, "Unpaid months", 0, 120);
      days = boundedInteger(payload.days || 0, "Unpaid days", 0, 29);
      {
        membership.unpaidMonths = months;
        membership.unpaidDays = days;
        membership.feeStatus = months > 0 || days > 0 ? "due" : "paid";
        membership.feeRequired = true;
        // The operator has set the exact balance as of today. Move the next
        // automatic cycle into the future so today's cycle is not added again.
        membership.nextDueDate = moveDueDateToNextCycle(
          membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate,
        );
        if (months === 0 && days === 0) {
          membership.effectiveDueDate = membership.nextDueDate;
        }
      }
      break;
    case "pause":
      membership.status = "paused";
      membership.pausedAt = new Date();
      break;
    case "resume": {
      membership.status = "active";
      if (payload.resumeDate && Number(membership.remainingTrainingDays || 0) > 0) {
        const resumeDate = parseMembershipDate(payload.resumeDate, "Resume date");
        // Inclusive academy rule: 20 paid days resumed on Sep 1 become due
        // on Sep 20 (Sep 1 is day one), not Sep 21.
        membership.effectiveDueDate = addDays(resumeDate, Math.max(0, membership.remainingTrainingDays - 1));
        membership.nextDueDate = membership.effectiveDueDate;
        membership.remainingTrainingDays = 0;
        membership.autoMonthlyDue = true;
        membership.feeStatus = "paid";
      } else if (membership.pausedAt) {
        const pausedAt = new Date(membership.pausedAt);
        const today = new Date();
        const pausedDays = Math.max(0, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(pausedAt.getUTCFullYear(), pausedAt.getUTCMonth(), pausedAt.getUTCDate())) / 86400000));
        membership.nextDueDate = addDays(
          membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate,
          pausedDays,
        );
        membership.effectiveDueDate = membership.nextDueDate;
      }
      membership.pausedAt = null;
      break;
    }
    case "set_fee_status": {
      const allowed = ["paid", "due", "partial", "waived", "complimentary"];
      const feeStatus = clean(payload.feeStatus).toLowerCase();
      if (!allowed.includes(feeStatus)) throw createError("Fee status is invalid");
      const wasFeeRequired = membership.feeRequired !== false;
      membership.feeStatus = feeStatus;
      membership.feeRequired = !["waived", "complimentary"].includes(feeStatus);
      if (feeStatus === "complimentary") membership.status = "complimentary";
      else if (membership.status === "complimentary") membership.status = "active";
      if (feeStatus === "paid") {
        membership.unpaidMonths = 0;
        membership.unpaidDays = 0;
        const accrual = calculateMembershipAccrualState(membership);
        membership.nextDueDate = moveDueDateToNextCycle(
          accrual.nextDueDate || membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate,
        );
        membership.effectiveDueDate = membership.nextDueDate;
      } else if (!wasFeeRequired && membership.feeRequired) {
        membership.nextDueDate = moveDueDateToNextCycle(
          membership.nextDueDate || membership.effectiveDueDate || membership.originalDueDate,
        );
        membership.effectiveDueDate = membership.nextDueDate;
      }
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

  queueFeeIntegritySync(academyId);

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

  queueFeeIntegritySync(academyId);

  return serializeMembership(membership);
};
