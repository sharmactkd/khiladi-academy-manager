import express from "express";
import { createExpense, createExpenseCategory, deleteExpense, deleteExpenseCategory, listExpenseCategories, listExpenses, reverseExpense, updateExpense } from "../controllers/expenseController.js";
import { resolveUserAcademy, requireResolvedAcademy } from "../middlewares/academyAccessMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowFeeManagement } from "../middlewares/roleMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { categoryTypeValidation, createCategoryValidation, createExpenseValidation, deleteCategoryValidation, deleteExpenseValidation, listExpenseValidation, reverseExpenseValidation, updateExpenseValidation } from "../validators/expenseValidator.js";

const router = express.Router();
router.use(protect, allowFeeManagement, resolveUserAcademy, requireResolvedAcademy);
router.get("/categories", categoryTypeValidation, validateRequest, listExpenseCategories);
router.post("/categories", createCategoryValidation, validateRequest, createExpenseCategory);
router.delete("/categories/:id", deleteCategoryValidation, validateRequest, deleteExpenseCategory);
router.get("/", listExpenseValidation, validateRequest, listExpenses);
router.post("/", createExpenseValidation, validateRequest, createExpense);
router.patch("/:id", updateExpenseValidation, validateRequest, updateExpense);
router.delete("/:id", deleteExpenseValidation, validateRequest, deleteExpense);
router.post("/:id/reverse", reverseExpenseValidation, validateRequest, reverseExpense);
export default router;
