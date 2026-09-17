import assert from "node:assert/strict";
import test from "node:test";
import { buildExpenseListFilter, buildExpenseMutationPayload, isDefaultCategory, isManualExpenseTransaction, normalizeCategoryName, parseExpensePagination } from "../src/utils/expenseUtils.js";
test("category normalization blocks default duplicates", () => { assert.equal(normalizeCategoryName("  RENT  "), "rent"); assert.equal(isDefaultCategory("expense", " rent "), true); });
test("pagination is bounded", () => { assert.deepEqual(parseExpensePagination({}), { page: 1, limit: 25 }); assert.deepEqual(parseExpensePagination({ page: "3", limit: "500" }), { page: 3, limit: 100 }); });
test("list filters exclude reversals", () => { const filter = buildExpenseListFilter("academy", { type: "expense" }); assert.equal(filter.reversedAt, null); assert.equal(filter.type, "expense"); });
test("expense edits use an explicit normalized payload", () => {
  const payload = buildExpenseMutationPayload({ type: "expense", category: "  Travel   Cost ", amount: "1250", account: "upi", date: "2026-09-17", description: "  Tournament cab  ", forbidden: "ignored" });
  assert.deepEqual(payload, { type: "expense", category: "Travel Cost", amount: 1250, account: "upi", date: "2026-09-17", branch: null, description: "Tournament cab" });
  assert.equal("forbidden" in payload, false);
});
test("only standalone manual transactions can be edited or deleted", () => {
  assert.equal(isManualExpenseTransaction({ sourceType: "manual", sourceId: null }), true);
  assert.equal(isManualExpenseTransaction({ sourceType: "fee_payment", sourceId: "payment-id" }), false);
  assert.equal(isManualExpenseTransaction({ sourceType: "manual", sourceId: "linked-id" }), false);
});
