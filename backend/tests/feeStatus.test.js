import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFeeDueBalance,
  normalizeFeeStatus,
  resolveFeeStatus,
} from "../src/utils/feeStatus.js";

test("legacy overdue and pending statuses normalize to due", () => {
  assert.equal(normalizeFeeStatus("overdue"), "due");
  assert.equal(normalizeFeeStatus("PENDING"), "due");
});

test("remaining training days always resolve as paid", () => {
  const result = resolveFeeStatus({
    membership: { remainingTrainingDays: 10, unpaidMonths: 3, feeStatus: "overdue" },
  });
  assert.equal(result.code, "paid");
  assert.equal(result.source, "remaining-days");
});

test("unpaid day-only and mixed balances preserve exact duration", () => {
  assert.equal(formatFeeDueBalance(0, 10), "10D DUE");
  assert.equal(formatFeeDueBalance(7, 10), "7M, 10D DUE");
  assert.equal(resolveFeeStatus({ membership: { unpaidDays: 10 } }).label, "10D DUE");
});

test("monthly ledger resolves paid, partial and due consistently", () => {
  assert.equal(resolveFeeStatus({ payableAmount: 1000, paidAmount: 1000 }).code, "paid");
  assert.equal(resolveFeeStatus({ payableAmount: 1000, paidAmount: 400 }).code, "partial");
  assert.equal(resolveFeeStatus({ payableAmount: 1000, paidAmount: 0 }).code, "due");
  assert.equal(resolveFeeStatus({ payableAmount: 0, paidAmount: 0 }).code, "paid");
});

test("waived and complimentary override payment calculations", () => {
  assert.equal(resolveFeeStatus({ membership: { feeStatus: "waived" }, payableAmount: 500 }).code, "waived");
  assert.equal(resolveFeeStatus({ membership: { feeStatus: "complimentary" }, payableAmount: 500 }).code, "complimentary");
});
