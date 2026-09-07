import { body, param, query } from "express-validator";
const validDateKey = (value) => {
  const text = String(value);
  const date = new Date(`${text}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new Error("Invalid date. Use YYYY-MM-DD.");
  return true;
};
export const listExpenseValidation = [query("type").optional().isIn(["income", "expense"]), query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 }), query("from").optional().custom(validDateKey), query("to").optional().custom(validDateKey)];
export const createExpenseValidation = [body("type").isIn(["income", "expense"]), body("category").isString().trim().isLength({ min: 1, max: 80 }), body("amount").isFloat({ gt: 0 }), body("account").optional().isIn(["cash", "bank", "upi", "other"]), body("date").custom(validDateKey), body("branch").optional({ nullable: true, checkFalsy: true }).isMongoId(), body("description").optional().isString().trim().isLength({ max: 500 })];
export const reverseExpenseValidation = [param("id").isMongoId(), body("reason").isString().trim().isLength({ min: 3, max: 300 })];
export const categoryTypeValidation = [query("type").optional().isIn(["income", "expense"])];
export const createCategoryValidation = [body("type").isIn(["income", "expense"]), body("name").isString().trim().isLength({ min: 1, max: 80 })];
export const deleteCategoryValidation = [param("id").isMongoId()];
