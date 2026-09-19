import test from "node:test";
import assert from "node:assert/strict";

import { buildAutomaticFeeIntegrityPlan } from "../src/utils/feeIntegrity.js";

test("automatic integrity safely aligns membership status with provable balances", () => {
  const plan = buildAutomaticFeeIntegrityPlan({ memberships: [
    { _id: "m1", academy: "a1", feeStatus: "due", remainingTrainingDays: 20, unpaidMonths: 0, unpaidDays: 0 },
    { _id: "m2", academy: "a1", feeStatus: "paid", remainingTrainingDays: 0, unpaidMonths: 1, unpaidDays: 0 },
    { _id: "m3", academy: "a1", feeStatus: "waived", unpaidMonths: 3 },
    { _id: "m4", academy: "a1", feeStatus: "paid", unpaidMonths: 0, unpaidDays: 0 },
  ] });
  assert.deepEqual(plan.memberships.map(item => [item.membershipId, item.expected]), [["m1", "paid"], ["m2", "due"]]);
});

test("automatic integrity repairs payment totals and linked income deterministically", () => {
  const payments = [{
    _id: "p1", academy: "a1", amount: 1000, discount: 100, finalAmount: 1000,
    amountPaid: 0, pendingAmount: 1000, status: "due", paymentMode: "cash",
    collectedBy: "u1", installments: [{ amountPaid: 900 }],
  }];
  const plan = buildAutomaticFeeIntegrityPlan({ payments, incomes: [] });
  assert.equal(plan.payments.length, 1);
  assert.deepEqual(plan.payments[0].truth, { finalAmount: 900, amountPaid: 900, pendingAmount: 0, status: "paid" });
  assert.equal(plan.incomes[0].type, "create");
  assert.equal(plan.incomes[0].values.amount, 900);
});

test("automatic integrity does not invent a missing income owner", () => {
  const plan = buildAutomaticFeeIntegrityPlan({ payments: [{
    _id: "p1", academy: "a1", amount: 500, finalAmount: 500, amountPaid: 500,
    pendingAmount: 0, status: "paid", installments: [],
  }] });
  assert.equal(plan.incomes.length, 0);
  assert.equal(plan.skipped[0].type, "missing_income_actor");
});
