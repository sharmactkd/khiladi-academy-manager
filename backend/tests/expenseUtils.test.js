import assert from "node:assert/strict";
import test from "node:test";
import { buildExpenseListFilter, isDefaultCategory, normalizeCategoryName, parseExpensePagination } from "../src/utils/expenseUtils.js";
test("category normalization blocks default duplicates", () => { assert.equal(normalizeCategoryName("  RENT  "), "rent"); assert.equal(isDefaultCategory("expense", " rent "), true); });
test("pagination is bounded", () => { assert.deepEqual(parseExpensePagination({}), { page: 1, limit: 25 }); assert.deepEqual(parseExpensePagination({ page: "3", limit: "500" }), { page: 3, limit: 100 }); });
test("list filters exclude reversals", () => { const filter = buildExpenseListFilter("academy", { type: "expense" }); assert.equal(filter.reversedAt, null); assert.equal(filter.type, "expense"); });
