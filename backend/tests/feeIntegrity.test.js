import assert from "node:assert/strict";
import test from "node:test";
import { derivePaymentTruth, expectedMembershipFeeStatus, paymentHasMismatch } from "../src/utils/feeIntegrity.js";

test("payment truth uses active installments and preserves cancellation", () => {
  const payment = { amount: 1000, discount: 100, status: "partial", installments: [{ amountPaid: 500 }, { amountPaid: 400, reversedAt: new Date() }] };
  assert.deepEqual(derivePaymentTruth(payment), { finalAmount: 900, amountPaid: 500, pendingAmount: 400, status: "partial" });
  assert.equal(derivePaymentTruth({ ...payment, status: "cancelled" }).status, "cancelled");
});
test("payment mismatch detects status and numeric drift", () => {
  assert.equal(paymentHasMismatch({ amount: 1000, discount: 0, finalAmount: 1000, amountPaid: 1000, pendingAmount: 0, status: "due" }), true);
  assert.equal(paymentHasMismatch({ amount: 1000, discount: 0, finalAmount: 1000, amountPaid: 1000, pendingAmount: 0, status: "paid" }), false);
});
test("membership truth only repairs provable contradictions", () => {
  assert.equal(expectedMembershipFeeStatus({ remainingTrainingDays: 5, feeStatus: "due" }), "paid");
  assert.equal(expectedMembershipFeeStatus({ unpaidDays: 10, feeStatus: "paid" }), "due");
  assert.equal(expectedMembershipFeeStatus({ feeStatus: "paid" }), null);
  assert.equal(expectedMembershipFeeStatus({ unpaidMonths: 4, feeStatus: "waived" }), "waived");
});
