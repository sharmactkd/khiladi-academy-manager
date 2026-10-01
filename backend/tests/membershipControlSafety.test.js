import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync(new URL("../src/services/membershipService.js", import.meta.url), "utf8");

test("manual paid/due status is an audited override without deleting outstanding balance", () => {
  assert.match(service, /const allowed = \["paid", "due", "waived", "complimentary"\]/);
  const block = service.split('case "set_fee_status":')[1].split('case "clear_fee_status":')[0];
  assert.match(block, /membership.manualFeeStatus =/);
  assert.doesNotMatch(block, /unpaidMonths\s*=|unpaidDays\s*=/);
});

test("membership reasons are optional for every adjustment and reversal", () => {
  assert.doesNotMatch(service, /Reason is required for membership changes/);
  assert.doesNotMatch(service, /Reversal reason is required/);
});

test("legacy clear fee action does not erase outstanding balance", () => {
  const clearBlock = service.split('case "clear_fee_status":')[1].split('case "set_note":')[0];
  assert.doesNotMatch(clearBlock, /unpaidMonths\s*=/);
  assert.doesNotMatch(clearBlock, /feeRequired\s*=/);
  assert.match(clearBlock, /feeStatusCleared = true/);
});

test("membership changes and audit history are committed atomically", () => {
  assert.match(service, /session\.withTransaction/);
  assert.match(service, /membership\.save\(\{ session \}\)/);
  assert.match(service, /MembershipAdjustment\.create\(\[/);
});

test("reversal refuses to overwrite membership changed after the adjustment", () => {
  assert.match(service, /Membership changed after this adjustment and cannot be safely reversed/);
});
