import test from "node:test";
import assert from "node:assert/strict";
import { calculateAccruedUnpaidMonths } from "../src/utils/membershipMonthlyDue.js";

const membership = (extra = {}) => ({ autoMonthlyDue: true, effectiveDueDate: new Date("2026-09-05T00:00:00.000Z"), unpaidMonths: 0, status: "active", feeRequired: true, ...extra });
test("monthly dues start on the custom due date without attendance conditions", () => {
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-09-04T23:59:59Z")), 0);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-09-05T00:00:00Z")), 1);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-10-04T23:59:59Z")), 1);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-10-05T00:00:00Z")), 2);
  assert.equal(calculateAccruedUnpaidMonths(membership({unpaidMonths:24}), new Date("2026-10-05T00:00:00Z")), 26);
});
test("legacy, paused, complimentary and fee-waived memberships do not auto-accrue", () => {
  assert.equal(calculateAccruedUnpaidMonths({...membership(),autoMonthlyDue:false},new Date("2027-01-05Z")),0);
  assert.equal(calculateAccruedUnpaidMonths(membership({status:'paused'}),new Date("2027-01-05Z")),0);
  assert.equal(calculateAccruedUnpaidMonths(membership({feeRequired:false}),new Date("2027-01-05Z")),0);
});
