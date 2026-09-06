import ExpenseTransaction from "../models/ExpenseTransaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

const clean = (body) => ({ type: body.type, category: String(body.category || "").trim(), amount: Number(body.amount), account: body.account || "cash", date: body.date || new Date(), branch: body.branch || null, description: body.description || "" });
export const listExpenses = asyncHandler(async (req, res) => {
  const filter = { academy: req.academyId, reversedAt: null };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.from || req.query.to) { filter.date = {}; if (req.query.from) filter.date.$gte = new Date(req.query.from); if (req.query.to) filter.date.$lte = new Date(`${req.query.to}T23:59:59.999Z`); }
  const transactions = await ExpenseTransaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(500).populate("branch", "branchName");
  const summary = transactions.reduce((out, row) => { out[row.type] += Number(row.amount || 0); return out; }, { income: 0, expense: 0 });
  return successResponse(res, "Expense transactions fetched successfully", { transactions, summary, balance: summary.income - summary.expense });
});
export const createExpense = asyncHandler(async (req, res) => {
  const payload = clean(req.body);
  if (!["income", "expense"].includes(payload.type) || !payload.category || !Number.isFinite(payload.amount) || payload.amount <= 0) return res.status(400).json({ success: false, message: "Type, category and a positive amount are required." });
  const transaction = await ExpenseTransaction.create({ ...payload, academy: req.academyId, createdBy: req.user._id });
  return successResponse(res, "Transaction added successfully", { transaction }, 201);
});
export const reverseExpense = asyncHandler(async (req, res) => {
  const transaction = await ExpenseTransaction.findOneAndUpdate({ _id: req.params.id, academy: req.academyId, reversedAt: null }, { reversedAt: new Date(), reversalReason: String(req.body.reason || "Reversed by manager") }, { new: true });
  if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });
  return successResponse(res, "Transaction reversed successfully", { transaction });
});
