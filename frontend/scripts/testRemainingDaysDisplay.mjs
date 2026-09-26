import test from "node:test";
import assert from "node:assert/strict";
import { formatRemainingTrainingTime, remainingDaysDisplay } from "../src/components/attendance/remainingDaysDisplay.js";

test("remaining days replace date even when unpaid months exist", () => {
  const membership = { remainingTrainingDays:10, effectiveDueDate:"2026-09-15", unpaidMonths:24, feeStatus:"due" };
  assert.deepEqual(remainingDaysDisplay(membership), {label:"10D LEFT",tone:"blue"});
  assert.equal(membership.feeStatus,"due");
  assert.equal(membership.effectiveDueDate,"2026-09-15");
});
test("paused state does not hide remaining balance and balance uses months plus days", () => {
  assert.equal(remainingDaysDisplay({remainingTrainingDays:10,status:"paused"}).label,"10D LEFT");
  assert.equal(remainingDaysDisplay({remainingTrainingDays:35,status:"paused"}).label,"1M 5D LEFT");
  assert.equal(remainingDaysDisplay({remainingTrainingDays:1}).label,"1D LEFT");
  assert.equal(formatRemainingTrainingTime(60), "2M");
});
test("no remaining days uses existing date fallback", () => {
  for (const value of [undefined,0,-1,"invalid",Infinity]) assert.equal(remainingDaysDisplay({remainingTrainingDays:value}),null);
  assert.equal(remainingDaysDisplay(null),null);
});
