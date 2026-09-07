import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import ExpenseTransaction from "../models/ExpenseTransaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { buildExpenseListFilter, cleanCategoryName, isDefaultCategory, normalizeCategoryName, parseExpensePagination } from "../utils/expenseUtils.js";

const summaryForAcademy = async (academy) => {
  const rows = await ExpenseTransaction.aggregate([
    { $match: { academy: new mongoose.Types.ObjectId(String(academy)), reversedAt: null } },
    { $group: { _id: "$type", amount: { $sum: "$amount" } } },
  ]);
  const summary = { income: 0, expense: 0 };
  rows.forEach((row) => { if (row._id in summary) summary[row._id] = Number(row.amount || 0); });
  return summary;
};

export const listExpenses = asyncHandler(async (req, res) => {
  const { page, limit } = parseExpensePagination(req.query);
  const filter = buildExpenseListFilter(req.academyId, req.query);
  const [transactions, total, summary] = await Promise.all([
    ExpenseTransaction.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("branch", "branchName"),
    ExpenseTransaction.countDocuments(filter),
    summaryForAcademy(req.academyId),
  ]);
  const pages = Math.max(1, Math.ceil(total / limit));
  return successResponse(res, "Expense transactions fetched successfully", { transactions, summary, balance: summary.income - summary.expense, pagination: { page, limit, total, pages, hasNextPage: page < pages } });
});

export const createExpense = asyncHandler(async (req, res) => {
  const payload = { type: req.body.type, category: cleanCategoryName(req.body.category), amount: Number(req.body.amount), account: req.body.account || "cash", date: req.body.date, branch: req.body.branch || null, description: String(req.body.description || "").trim() };
  if (payload.branch && !(await Branch.exists({ _id: payload.branch, academy: req.academyId }))) return res.status(400).json({ success: false, message: "Selected branch does not belong to this academy." });
  const transaction = await ExpenseTransaction.create({ ...payload, academy: req.academyId, createdBy: req.user._id });
  return successResponse(res, "Transaction added successfully", { transaction }, 201);
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
