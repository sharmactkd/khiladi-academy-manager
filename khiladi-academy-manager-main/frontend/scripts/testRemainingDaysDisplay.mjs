import test from "node:test";
import assert from "node:assert/strict";
import { remainingDaysDisplay } from "../src/components/attendance/remainingDaysDisplay.js";

test("remaining days replace date even when unpaid months exist", () => {
  const membership = { remainingTrainingDays:10, effectiveDueDate:"2026-09-15", unpaidMonths:24, feeStatus:"due" };
  assert.deepEqual(remainingDaysDisplay(membership), {label:"10 DAYS LEFT",tone:"blue"});
  assert.equal(membership.feeStatus,"due");
  assert.equal(membership.effectiveDueDate,"2026-09-15");
});
test("paused and singular labels", () => {
  assert.equal(remainingDaysDisplay({remainingTrainingDays:10,status:"paused"}).label,"PAUSED · 10 DAYS LEFT");
  assert.equal(remainingDaysDisplay({remainingTrainingDays:1}).label,"1 DAY LEFT");
});
test("no remaining days uses existing date fallback", () => {
  for (const value of [undefined,0,-1,"invalid",Infinity]) assert.equal(remainingDaysDisplay({remainingTrainingDays:value}),null);
  assert.equal(remainingDaysDisplay(null),null);
});
