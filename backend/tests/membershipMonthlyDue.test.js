import test from "node:test";
import assert from "node:assert/strict";
import { addBillingMonthsClamped, calculateAccruedUnpaidMonths, calculateMembershipAccrualState } from "../src/utils/membershipMonthlyDue.js";

const membership = (extra = {}) => ({ autoMonthlyDue: true, effectiveDueDate: new Date("2026-09-05T00:00:00.000Z"), unpaidMonths: 0, status: "active", feeRequired: true, ...extra });
test("monthly dues start on the custom due date without attendance conditions", () => {
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-09-04T23:59:59Z")), 0);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-09-05T00:00:00Z")), 1);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-10-04T23:59:59Z")), 1);
  assert.equal(calculateAccruedUnpaidMonths(membership(), new Date("2026-10-05T00:00:00Z")), 2);
  assert.equal(calculateAccruedUnpaidMonths(membership({unpaidMonths:24}), new Date("2026-10-05T00:00:00Z")), 24);
});
test("legacy, paused, complimentary and fee-waived memberships do not auto-accrue", () => {
  assert.equal(calculateAccruedUnpaidMonths({...membership(),autoMonthlyDue:false},new Date("2027-01-05Z")),0);
  assert.equal(calculateAccruedUnpaidMonths(membership({status:'paused'}),new Date("2027-01-05Z")),0);
  assert.equal(calculateAccruedUnpaidMonths(membership({feeRequired:false}),new Date("2027-01-05Z")),0);
});

test("remaining training days keep membership paid without accruing dues", () => {
  assert.equal(calculateAccruedUnpaidMonths(membership({ remainingTrainingDays: 10 }), new Date("2026-12-05T00:00:00Z")), 0);
});

test("custom twentieth due date accrues on the twentieth and preserves its anchor", () => {
  const custom = membership({ effectiveDueDate: new Date("2026-09-20T00:00:00.000Z") });
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-09-19T23:59:59.000Z")), 0);
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-09-20T00:00:00.000Z")), 1);
  assert.equal(addBillingMonthsClamped(custom.effectiveDueDate, 1).toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(addBillingMonthsClamped(custom.effectiveDueDate, 2).toISOString(), "2026-11-20T00:00:00.000Z");
});

test("materialized unpaid balance is not added to the same calendar cycles twice", () => {
  const custom = membership({ effectiveDueDate: new Date("2026-09-20T00:00:00.000Z"), unpaidMonths: 2 });
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-10-21T00:00:00.000Z")), 2);
});

test("manual arrears and the next billing date accrue independently", () => {
  const custom = membership({
    effectiveDueDate: new Date("2026-09-25T00:00:00.000Z"),
    nextDueDate: new Date("2026-09-25T00:00:00.000Z"),
    unpaidMonths: 2,
    unpaidDays: 20,
  });
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-09-24T23:59:59.000Z")), 2);
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-09-25T00:00:00.000Z")), 3);
  assert.equal(calculateAccruedUnpaidMonths(custom, new Date("2026-10-25T00:00:00.000Z")), 4);
  assert.equal(
    calculateMembershipAccrualState(custom, new Date("2026-09-25T00:00:00.000Z")).nextDueDate.toISOString(),
    "2026-10-25T00:00:00.000Z",
  );
});
