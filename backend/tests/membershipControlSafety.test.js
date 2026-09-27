import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync(new URL("../src/services/membershipService.js", import.meta.url), "utf8");

test("manual fee control cannot mark a membership paid, due or partial", () => {
  assert.match(service, /const allowed = \["waived", "complimentary"\]/);
  assert.match(service, /must come from fee transactions/);
});

test("state-changing membership actions require an audit reason", () => {
  assert.match(service, /type !== "set_note" && !reason/);
});

test("legacy clear fee action does not erase outstanding balance", () => {
  const clearBlock = service.split('case "clear_fee_status":')[1].split('case "set_note":')[0];
  assert.doesNotMatch(clearBlock, /unpaidMonths\s*=/);
  assert.doesNotMatch(clearBlock, /feeRequired\s*=/);
  assert.match(clearBlock, /feeStatusCleared = true/);
});
