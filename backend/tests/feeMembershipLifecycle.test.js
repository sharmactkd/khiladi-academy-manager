import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_fee_test";
process.env.JWT_ACCESS_SECRET ||= "fee-lifecycle-access-secret-with-at-least-32-chars";
process.env.JWT_REFRESH_SECRET ||= "fee-lifecycle-refresh-secret-with-at-least-32-chars";

const { deriveMembershipCollectionState } = await import("../src/services/feeService.js");

const membership = {
  status: "active",
  feeRequired: true,
  autoMonthlyDue: true,
  effectiveDueDate: new Date("2026-09-20T00:00:00.000Z"),
  originalDueDate: new Date("2026-09-20T00:00:00.000Z"),
  unpaidMonths: 0,
  unpaidDays: 0,
};

test("one month paid on Sep 22 moves a Sep 20 custom due date to Oct 20", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 1, latestStatus: "paid", now: new Date("2026-09-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 0);
  assert.equal(result.feeStatus, "paid");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-10-20T00:00:00.000Z");
});

test("two months paid on Sep 22 preserves the custom anchor through Nov 20", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 2, latestStatus: "paid", now: new Date("2026-09-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 0);
  assert.equal(result.feeStatus, "paid");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-11-20T00:00:00.000Z");
});

test("one payment against two due cycles leaves one cycle due and advances oldest due date", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 1, latestStatus: "paid", now: new Date("2026-10-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 1);
  assert.equal(result.feeStatus, "due");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-10-20T00:00:00.000Z");
});

test("partial collection remains partial without advancing the due date", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 0, latestStatus: "partial", now: new Date("2026-09-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 1);
  assert.equal(result.feeStatus, "partial");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-09-20T00:00:00.000Z");
});
