import assert from "node:assert/strict";
import { defaultCategoriesFor, normalizeExpenseCategory } from "../src/pages/expenses/expenseCategories.js";
import { localDateKey } from "../src/utils/localCalendarDate.js";

assert.equal(normalizeExpenseCategory("  Student   Fee "), "student fee");
assert.equal(defaultCategoriesFor("expense").some((name) => normalizeExpenseCategory(name) === "rent"), true);
assert.equal(defaultCategoriesFor("income").some((name) => normalizeExpenseCategory(name) === "student fee"), true);
assert.equal(localDateKey(new Date(2026, 8, 7, 1, 15)), "2026-09-07");
console.log("Expense Manager frontend checks passed");
