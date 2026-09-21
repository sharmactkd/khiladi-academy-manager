import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_fee_test";
process.env.JWT_ACCESS_SECRET ||= "fee-lifecycle-access-secret-with-at-least-32-chars";
process.env.JWT_REFRESH_SECRET ||= "fee-lifecycle-refresh-secret-with-at-least-32-chars";

const { buildDueDate, deriveMembershipCollectionState } = await import("../src/services/feeService.js");
const { serializeMembership } = await import("../src/services/membershipService.js");

const membership = {
  status: "active",
  feeRequired: true,
  autoMonthlyDue: true,
  effectiveDueDate: new Date("2026-09-20T00:00:00.000Z"),
  nextDueDate: new Date("2026-09-20T00:00:00.000Z"),
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
  assert.equal(result.nextDueDate.toISOString(), "2026-11-20T00:00:00.000Z");
});

test("one payment against two due cycles leaves one cycle due and advances oldest due date", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 1, latestStatus: "paid", now: new Date("2026-10-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 1);
  assert.equal(result.feeStatus, "due");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(result.nextDueDate.toISOString(), "2026-11-20T00:00:00.000Z");
});

test("partial collection remains partial without advancing the due date", () => {
  const result = deriveMembershipCollectionState({ membership, completedPeriods: 0, latestStatus: "partial", now: new Date("2026-09-22T00:00:00.000Z") });
  assert.equal(result.unpaidMonths, 1);
  assert.equal(result.feeStatus, "partial");
  assert.equal(result.effectiveDueDate.toISOString(), "2026-09-20T00:00:00.000Z");
  assert.equal(result.nextDueDate.toISOString(), "2026-10-20T00:00:00.000Z");
});

test("early and late payments preserve the twenty-fifth billing anchor", () => {
  const anchored = {
    ...membership,
    effectiveDueDate: new Date("2026-09-25T00:00:00.000Z"),
    nextDueDate: new Date("2026-09-25T00:00:00.000Z"),
  };
  const early = deriveMembershipCollectionState({ membership: anchored, completedPeriods: 1, latestStatus: "paid", now: new Date("2026-09-22T00:00:00.000Z") });
  const late = deriveMembershipCollectionState({ membership: anchored, completedPeriods: 1, latestStatus: "paid", now: new Date("2026-09-27T00:00:00.000Z") });
  assert.equal(early.effectiveDueDate.toISOString(), "2026-10-25T00:00:00.000Z");
  assert.equal(late.effectiveDueDate.toISOString(), "2026-10-25T00:00:00.000Z");
});

test("fee due dates are UTC calendar dates in every server timezone", () => {
  assert.equal(buildDueDate(9, 2026, 25).toISOString(), "2026-09-25T00:00:00.000Z");
  assert.equal(buildDueDate(2, 2027, 31).toISOString(), "2027-02-28T00:00:00.000Z");
});

test("one manual unpaid month stays due while the next cycle remains internal", () => {
  const result = serializeMembership({
    status: "active",
    feeRequired: true,
    autoMonthlyDue: true,
    feeStatus: "due",
    effectiveDueDate: new Date("2026-09-05T00:00:00.000Z"),
    nextDueDate: new Date("2026-10-05T00:00:00.000Z"),
    unpaidMonths: 1,
    unpaidDays: 0,
  });
  assert.equal(result.effectiveDueDate.toISOString(), "2026-09-05T00:00:00.000Z");
  assert.equal(result.nextDueDate.toISOString(), "2026-10-05T00:00:00.000Z");
  assert.equal(result.feeStatusSummary.label, "1M DUE");
});

test("custom due date replaces a stale remaining-days display", () => {
  const source = readFileSync(new URL("../src/services/membershipService.js", import.meta.url), "utf8");
  const setDueDateCase = source.match(/case "set_due_date":[\s\S]*?break;/)?.[0] || "";
  assert.match(setDueDateCase, /membership\.remainingTrainingDays\s*=\s*0/);
});

test("cleared fee status serializes as an intentional blank", () => {
  const result = serializeMembership({
    status: "active",
    feeRequired: false,
    feeStatus: "paid",
    feeStatusCleared: true,
    dueDateCleared: false,
    effectiveDueDate: new Date("2026-10-01T00:00:00.000Z"),
    nextDueDate: new Date("2026-10-01T00:00:00.000Z"),
    unpaidMonths: 0,
    unpaidDays: 0,
  });
  assert.equal(result.feeStatus, "");
  assert.equal(result.feeStatusSummary, null);
  assert.equal(result.effectiveDueDate.toISOString(), "2026-10-01T00:00:00.000Z");
});
