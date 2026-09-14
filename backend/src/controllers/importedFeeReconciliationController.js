import crypto from "node:crypto";
import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import ImportedFeeSnapshot from "../models/ImportedFeeSnapshot.js";
import MembershipAdjustment from "../models/MembershipAdjustment.js";
import Student from "../models/Student.js";
import StudentMembership from "../models/StudentMembership.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { normalizeFeeStatus } from "../utils/feeStatus.js";
import { parseImportedFeeBalance } from "../utils/importedFee.js";

const clean = value => String(value ?? "").trim();
const day = value => {
  const raw = clean(value);
  if (!raw) return null;
  let y, m, d, match;
  if ((match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/))) [, y, m, d] = match;
  else if ((match = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/))) [, d, m, y] = match;
  else if ((match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/))) [, d, m, y] = match;
  else return null;
  if (String(y).length === 2) y = `20${y}`;
  const result = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return result.getUTCFullYear() === Number(y) && result.getUTCMonth() === Number(m) - 1 && result.getUTCDate() === Number(d) ? result : null;
};

const normalizeCandidate = ({ record, attendance }) => {
  const rawStatus = clean(record.importedFeeStatus);
  const rawDueDate = clean(record.importedDueDate);
  const rawPaidDate = clean(record.importedPaidDate);
  const balance = parseImportedFeeBalance(rawStatus);
  const status = normalizeFeeStatus(rawStatus, rawPaidDate ? "paid" : "due");
  const feeStatus = status === "paid" ? "paid" : status === "partial" ? "partial" : "due";
  const warnings = [];
  if (rawDueDate && !day(rawDueDate)) warnings.push("Due date format invalid");
  if (rawPaidDate && !day(rawPaidDate)) warnings.push("Paid date format invalid");
  if (!rawStatus && !rawDueDate && !rawPaidDate) warnings.push("No fee metadata");
  return {
    studentId: String(record.student), batchId: String(attendance.batch || ""),
    sourceSheet: clean(record.importedSourceSheet), sourceAttendanceDate: attendance.date,
    raw: { dueDate: rawDueDate, paidDate: rawPaidDate, feeStatus: rawStatus, feePaid: clean(record.importedFeePaid) },
    normalized: { dueDate: day(rawDueDate), paidDate: day(rawPaidDate), feeStatus, unpaidMonths: balance.months, unpaidDays: balance.days },
    warnings,
  };
};

const loadCandidates = async ({ academyId, batchId }) => {
  const query = { academy: academyId, "records.student": { $ne: null } };
  if (batchId) query.batch = batchId;
  const docs = await Attendance.find(query).select("batch date records").sort({ date: -1 }).lean();
  const latest = new Map();
  for (const attendance of docs) for (const record of attendance.records || []) {
    if (!record.student || latest.has(String(record.student))) continue;
    const candidate = normalizeCandidate({ record, attendance });
    if (candidate.warnings[0] !== "No fee metadata") latest.set(candidate.studentId, candidate);
  }
  const students = await Student.find({ academy: academyId, _id: { $in: [...latest.keys()] } }).select("firstName lastName admissionNumber batch status").lean();
  const names = new Map(students.map(student => [String(student._id), student]));
  return [...latest.values()].filter(item => names.has(item.studentId)).map(item => {
    const student = names.get(item.studentId);
    return { ...item, student: { _id: student._id, name: `${student.firstName || ""} ${student.lastName || ""}`.trim(), admissionNumber: student.admissionNumber || "", status: student.status } };
  });
};

export const previewImportedFees = asyncHandler(async (req, res) => {
  const candidates = await loadCandidates({ academyId: req.academyId, batchId: req.query.batch || null });
  return successResponse(res, "Imported fee reconciliation preview ready", {
    candidates,
    summary: { total: candidates.length, ready: candidates.filter(item => !item.warnings.length).length, warnings: candidates.filter(item => item.warnings.length).length },
    policy: "No receipt or payment amount is created. Only confirmed membership state and an audited source snapshot are saved.",
  });
});

export const applyImportedFees = asyncHandler(async (req, res) => {
  const requested = [...new Set((Array.isArray(req.body.studentIds) ? req.body.studentIds : []).map(String))];
  if (!requested.length || requested.length > 500 || requested.some(id => !mongoose.Types.ObjectId.isValid(id))) return errorResponse(res, "Select 1 to 500 valid students", 400);
  const candidates = await loadCandidates({ academyId: req.academyId, batchId: req.body.batch || null });
  const selected = candidates.filter(item => requested.includes(item.studentId));
  const summary = { applied: 0, skipped: requested.length - selected.length, warnings: [] };
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of selected) {
        if (item.warnings.length) { summary.skipped += 1; summary.warnings.push({ studentId: item.studentId, messages: item.warnings }); continue; }
        const fingerprint = crypto.createHash("sha256").update(JSON.stringify({ academy: String(req.academyId), ...item.raw, studentId: item.studentId, sourceSheet: item.sourceSheet, sourceAttendanceDate: item.sourceAttendanceDate })).digest("hex");
        if (await ImportedFeeSnapshot.exists({ academy: req.academyId, fingerprint }).session(session)) { summary.skipped += 1; continue; }
        let membership = await StudentMembership.findOne({ academy: req.academyId, student: item.studentId }).session(session);
        if (!membership) membership = new StudentMembership({ academy: req.academyId, student: item.studentId, batch: item.batchId || null });
        if (["waived", "complimentary"].includes(membership.feeStatus)) { summary.skipped += 1; summary.warnings.push({ studentId: item.studentId, messages: ["Special fee status preserved"] }); continue; }
        const previousState = membership.toObject();
        membership.feeStatus = item.normalized.feeStatus;
        membership.unpaidMonths = item.normalized.feeStatus === "paid" ? 0 : item.normalized.unpaidMonths;
        membership.unpaidDays = item.normalized.feeStatus === "paid" ? 0 : item.normalized.unpaidDays;
        if (item.normalized.dueDate) {
          membership.originalDueDate ||= item.normalized.dueDate;
          membership.effectiveDueDate = item.normalized.dueDate;
          membership.autoMonthlyDue = true;
        }
        membership.lastAdjustedAt = new Date(); membership.lastAdjustedBy = req.user._id;
        await membership.save({ session });
        const snapshot = await ImportedFeeSnapshot.create([{ academy: req.academyId, student: item.studentId, batch: item.batchId || null, fingerprint, sourceSheet: item.sourceSheet, sourceAttendanceDate: item.sourceAttendanceDate, raw: item.raw, normalized: item.normalized, appliedToMembership: true, appliedAt: new Date(), createdBy: req.user._id }], { session });
        await MembershipAdjustment.create([{ academy: req.academyId, student: item.studentId, membership: membership._id, type: "import_fee_snapshot", months: item.normalized.unpaidMonths, days: item.normalized.unpaidDays, reason: "Confirmed historical fee metadata import", note: `Source snapshot ${snapshot[0]._id}`, previousState, nextState: membership.toObject(), createdBy: req.user._id }], { session });
        summary.applied += 1;
      }
    });
    return successResponse(res, "Imported fee data reconciled", summary);
  } finally { await session.endSession(); }
});
