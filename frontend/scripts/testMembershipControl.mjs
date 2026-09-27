import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/attendance/MembershipAdjustmentDrawer.jsx", import.meta.url), "utf8");

test("membership controller keeps payment status ledger-driven", () => {
  assert.doesNotMatch(source, /<option value="paid">/);
  assert.doesNotMatch(source, /<option value="due">/);
  assert.doesNotMatch(source, /<option value="partial">/);
  assert.match(source, /Waive outstanding fee/);
  assert.match(source, /Complimentary membership/);
});

test("dangerous one-click clear controls are not exposed", () => {
  assert.doesNotMatch(source, /Clear Fee Status/);
  assert.doesNotMatch(source, /Clear Due Date/);
  assert.doesNotMatch(source, /membership-quick-actions/);
});

test("audited membership changes require a reason", () => {
  assert.match(source, /Reason <b>\*<\/b>/);
  assert.match(source, /required/);
});
