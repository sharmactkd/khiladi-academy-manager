import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import ExpenseTransaction from "../models/ExpenseTransaction.js";
import FeePayment from "../models/FeePayment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { buildExpenseListFilter, buildExpenseMutationPayload, cleanCategoryName, isDefaultCategory, isManualExpenseTransaction, normalizeCategoryName, parseExpensePagination } from "../utils/expenseUtils.js";

const ensureOwnedBranch = async (academy, branch) => !branch || Boolean(await Branch.exists({ _id: branch, academy }));

const summaryForPeriod = async (academy, date) => {
  const match = { academy: new mongoose.Types.ObjectId(String(academy)), reversedAt: null };
  if (date) match.date = date;
  const rows = await ExpenseTransaction.aggregate([
    { $match: match },
    { $group: { _id: "$type", amount: { $sum: "$amount" }, transactions: { $sum: 1 } } },
  ]);
  const summary = { income: 0, expense: 0, incomeTransactions: 0, expenseTransactions: 0 };
  rows.forEach((row) => {
    if (!(row._id in summary)) return;
    summary[row._id] = Number(row.amount || 0);
    summary[`${row._id}Transactions`] = Number(row.transactions || 0);
  });
  return summary;
};

const categoryTotalsForPeriod = async (academy, date) => {
  const match = { academy: new mongoose.Types.ObjectId(String(academy)), reversedAt: null, type: "expense" };
  if (date) match.date = date;
  return ExpenseTransaction.aggregate([
    { $match: match },
    { $group: { _id: "$category", amount: { $sum: "$amount" }, transactions: { $sum: 1 } } },
    { $sort: { amount: -1, _id: 1 } },
    { $project: { _id: 0, category: "$_id", amount: 1, transactions: 1 } },
  ]);
};

const availableExpensePeriods = async (academy) => {
  const now = new Date();
  const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return ExpenseTransaction.aggregate([
  { $match: { academy: new mongoose.Types.ObjectId(String(academy)), reversedAt: null, date: { $lt: currentMonthEnd } } },
  { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, transactions: { $sum: 1 } } },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  { $project: { _id: 0, year: "$_id.year", month: "$_id.month", transactions: 1 } },
  ]);
};

const attachFeePaymentDetails = async (academy, transactions) => {
  const feePaymentIds = transactions
    .filter((row) => row.sourceType === "fee_payment" && row.sourceId)
    .map((row) => row.sourceId);
  if (!feePaymentIds.length) return transactions;
  const payments = await FeePayment.find({ academy, _id: { $in: feePaymentIds } })
    .select("_id student receiptNumber")
    .populate("student", "firstName lastName")
    .lean();
  const detailsById = new Map(payments.map((payment) => [String(payment._id), payment]));
  return transactions.map((row) => {
    const payment = detailsById.get(String(row.sourceId || ""));
    if (!payment) return row;
    const studentName = [payment.student?.firstName, payment.student?.lastName].filter(Boolean).join(" ").trim();
    return { ...row, paymentId: payment._id, receiptNumber: payment.receiptNumber || "", studentName };
  });
};

export const listExpenses = asyncHandler(async (req, res) => {
  const { page, limit } = parseExpensePagination(req.query);
  const filter = buildExpenseListFilter(req.academyId, req.query);
  const periodDate = filter.date;
  const [rawTransactions, total, summary, categoryBreakdown, availablePeriods] = await Promise.all([
    ExpenseTransaction.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("branch", "branchName").lean(),
    ExpenseTransaction.countDocuments(filter),
    summaryForPeriod(req.academyId, periodDate),
    categoryTotalsForPeriod(req.academyId, periodDate),
    availableExpensePeriods(req.academyId),
  ]);
  const transactions = await attachFeePaymentDetails(req.academyId, rawTransactions);
  const pages = Math.max(1, Math.ceil(total / limit));
  return successResponse(res, "Expense transactions fetched successfully", { transactions, summary, categoryBreakdown, availablePeriods, balance: summary.income - summary.expense, pagination: { page, limit, total, pages, hasNextPage: page < pages } });
});

export const createExpense = asyncHandler(async (req, res) => {
  const payload = buildExpenseMutationPayload(req.body);
  if (!(await ensureOwnedBranch(req.academyId, payload.branch))) return res.status(400).json({ success: false, message: "Selected branch does not belong to this academy." });
  const transaction = await ExpenseTransaction.create({ ...payload, academy: req.academyId, createdBy: req.user._id });
  return successResponse(res, "Transaction added successfully", { transaction }, 201);
});

export const updateExpense = asyncHandler(async (req, res) => {
  const transaction = await ExpenseTransaction.findOne({ _id: req.params.id, academy: req.academyId, reversedAt: null });
  if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found or no longer active." });
  if (!isManualExpenseTransaction(transaction)) return res.status(409).json({ success: false, message: "Linked fee income cannot be edited here. Update or reverse it from Payment History." });

  const payload = buildExpenseMutationPayload(req.body);
  if (!(await ensureOwnedBranch(req.academyId, payload.branch))) return res.status(400).json({ success: false, message: "Selected branch does not belong to this academy." });
  Object.assign(transaction, payload, { updatedBy: req.user._id });
  await transaction.save();
  return successResponse(res, "Transaction updated successfully", { transaction });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const transaction = await ExpenseTransaction.findOne({ _id: req.params.id, academy: req.academyId, reversedAt: null });
  if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found or already deleted." });
  if (!isManualExpenseTransaction(transaction)) return res.status(409).json({ success: false, message: "Linked fee income cannot be deleted here. Reverse it from Payment History." });

  const deletedAt = new Date();
  const reason = String(req.body?.reason || "").trim();
  Object.assign(transaction, { reversedAt: deletedAt, reversalReason: reason ? `Deleted: ${reason}` : "Deleted by user", deletedAt, deletedBy: req.user._id, deletionReason: reason });
  await transaction.save();
  return successResponse(res, "Transaction deleted successfully", { transaction });
});

export const reverseExpense = asyncHandler(async (req, res) => {
  const transaction = await ExpenseTransaction.findOneAndUpdate({ _id: req.params.id, academy: req.academyId, reversedAt: null }, { reversedAt: new Date(), reversalReason: String(req.body.reason).trim() }, { new: true, runValidators: true });
  if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found or already reversed." });
  return successResponse(res, "Transaction reversed successfully", { transaction });
});

export const listExpenseCategories = asyncHandler(async (req, res) => {
  const filter = { academy: req.academyId };
  if (req.query.type) filter.type = req.query.type;
  const categories = await ExpenseCategory.find(filter).sort({ type: 1, name: 1 });
  return successResponse(res, "Expense categories fetched successfully", { categories });
});

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const name = cleanCategoryName(req.body.name), type = req.body.type;
  if (isDefaultCategory(type, name)) return res.status(409).json({ success: false, message: "This category already exists in the default list." });
  try {
    const category = await ExpenseCategory.create({ academy: req.academyId, type, name, normalizedName: normalizeCategoryName(name), createdBy: req.user._id });
    return successResponse(res, "Custom category added successfully", { category }, 201);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "This custom category already exists." });
    throw error;
  }
});

export const deleteExpenseCategory = asyncHandler(async (req, res) => {
  const category = await ExpenseCategory.findOneAndDelete({ _id: req.params.id, academy: req.academyId });
  if (!category) return res.status(404).json({ success: false, message: "Custom category not found." });
  return successResponse(res, "Custom category removed successfully", { category });
});
