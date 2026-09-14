import mongoose from "mongoose";

import ExpenseTransaction from "../models/ExpenseTransaction.js";
import FeeIntegrityRun from "../models/FeeIntegrityRun.js";
import FeePayment from "../models/FeePayment.js";
import StudentMembership from "../models/StudentMembership.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { derivePaymentTruth, expectedMembershipFeeStatus, paymentHasMismatch } from "../utils/feeIntegrity.js";

const issue = (type, targetId, severity, title, details, repairable = true) => ({ id: `${type}:${targetId}`, type, targetId: String(targetId), severity, title, details, repairable });

const scan = async academyId => {
  const [payments, memberships, incomes] = await Promise.all([
    FeePayment.find({ academy: academyId }).populate("student", "firstName lastName admissionNumber").lean(),
    StudentMembership.find({ academy: academyId }).populate("student", "firstName lastName admissionNumber").lean(),
    ExpenseTransaction.find({ academy: academyId, sourceType: "fee_payment" }).lean(),
  ]);
  const incomeMap = new Map(incomes.map(item => [String(item.sourceId), item]));
  const issues = [];
  for (const payment of payments) {
    const truth = derivePaymentTruth(payment);
    const name = `${payment.student?.firstName || ""} ${payment.student?.lastName || ""}`.trim() || "Student";
    if (paymentHasMismatch(payment, truth)) issues.push(issue("payment_totals", payment._id, "high", `${name}: payment totals/status mismatch`, { current: { finalAmount: payment.finalAmount, amountPaid: payment.amountPaid, pendingAmount: payment.pendingAmount, status: payment.status }, expected: truth, receiptNumber: payment.receiptNumber }));
    const income = incomeMap.get(String(payment._id));
    if (payment.status === "cancelled") {
      if (income && !income.reversedAt) issues.push(issue("cancelled_income", payment._id, "high", `${name}: cancelled fee income is still active`, { incomeAmount: income.amount, receiptNumber: payment.receiptNumber }));
    } else if (truth.amountPaid > 0) {
      if (!income) issues.push(issue("missing_income", payment._id, "high", `${name}: fee income entry missing`, { expectedAmount: truth.amountPaid, receiptNumber: payment.receiptNumber }));
      else if (Math.abs(Number(income.amount || 0) - truth.amountPaid) > 0.01 || income.reversedAt) issues.push(issue("income_mismatch", payment._id, "high", `${name}: fee income amount/state mismatch`, { currentAmount: income.amount, expectedAmount: truth.amountPaid, reversedAt: income.reversedAt, receiptNumber: payment.receiptNumber }));
    }
  }
  for (const membership of memberships) {
    const expected = expectedMembershipFeeStatus(membership);
    if (expected && membership.feeStatus !== expected) {
      const name = `${membership.student?.firstName || ""} ${membership.student?.lastName || ""}`.trim() || "Student";
      issues.push(issue("membership_status", membership._id, "medium", `${name}: membership fee status mismatch`, { current: membership.feeStatus, expected, remainingTrainingDays: membership.remainingTrainingDays, unpaidMonths: membership.unpaidMonths, unpaidDays: membership.unpaidDays }));
    }
  }
  return issues;
};

export const scanFeeIntegrity = asyncHandler(async (req, res) => {
  const issues = await scan(req.academyId);
  const summary = { total: issues.length, high: issues.filter(item => item.severity === "high").length, medium: issues.filter(item => item.severity === "medium").length, repairable: issues.filter(item => item.repairable).length };
  await FeeIntegrityRun.create({ academy: req.academyId, mode: "scan", summary, performedBy: req.user._id });
  return successResponse(res, "Fee integrity scan completed", { issues, summary, scannedAt: new Date() });
});

export const repairFeeIntegrity = asyncHandler(async (req, res) => {
  const selected = [...new Set((Array.isArray(req.body.issueIds) ? req.body.issueIds : []).map(String))];
  if (!selected.length || selected.length > 500) return errorResponse(res, "Select 1 to 500 issues", 400);
  const current = await scan(req.academyId);
  const targets = current.filter(item => selected.includes(item.id) && item.repairable);
  const summary = { requested: selected.length, repaired: 0, skipped: selected.length - targets.length };
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of targets) {
        if (item.type === "membership_status") {
          const membership = await StudentMembership.findOne({ _id: item.targetId, academy: req.academyId }).session(session);
          const expected = expectedMembershipFeeStatus(membership);
          if (!membership || !expected) { summary.skipped += 1; continue; }
          membership.feeStatus = expected; membership.lastAdjustedAt = new Date(); membership.lastAdjustedBy = req.user._id;
          await membership.save({ session }); summary.repaired += 1; continue;
        }
        const payment = await FeePayment.findOne({ _id: item.targetId, academy: req.academyId }).session(session);
        if (!payment) { summary.skipped += 1; continue; }
        const truth = derivePaymentTruth(payment);
        if (item.type === "payment_totals") {
          payment.finalAmount = truth.finalAmount; payment.amountPaid = truth.amountPaid; payment.pendingAmount = truth.pendingAmount; payment.status = truth.status; payment.updatedBy = req.user._id;
          await payment.save({ session }); summary.repaired += 1; continue;
        }
        const base = { academy: req.academyId, branch: payment.branch || null, type: "income", category: "Student Fee", amount: truth.amountPaid, account: payment.paymentMode === "online" ? "upi" : payment.paymentMode === "cash" ? "cash" : "other", date: payment.paidDate || payment.paymentDate || new Date(), description: `Fee payment ${payment.receiptNumber || ""}`.trim(), sourceType: "fee_payment", sourceId: payment._id, createdBy: req.user._id };
        if (item.type === "cancelled_income") await ExpenseTransaction.updateOne({ academy: req.academyId, sourceType: "fee_payment", sourceId: payment._id }, { $set: { reversedAt: new Date(), reversalReason: payment.reversalReason || "Fee payment cancelled" } }, { session });
        else await ExpenseTransaction.updateOne({ academy: req.academyId, sourceType: "fee_payment", sourceId: payment._id }, { $set: { ...base, reversedAt: null, reversalReason: "" } }, { upsert: true, session });
        summary.repaired += 1;
      }
      await FeeIntegrityRun.create([{ academy: req.academyId, mode: "repair", summary, selectedIssueIds: selected, performedBy: req.user._id }], { session });
    });
    return successResponse(res, "Selected fee integrity issues repaired", summary);
  } finally { await session.endSession(); }
});
