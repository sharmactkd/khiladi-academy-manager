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

test("custom due date reason is optional while other changes require it", () => {
  assert.match(source, /form\.type === "set_due_date" \? <small>\(optional\)<\/small>/);
  assert.match(source, /required=\{form\.type !== "set_due_date"\}/);
});

test("due and remaining month/day adjustments are directly visible", () => {
  assert.match(source, /label: "Remaining Time"/);
  assert.match(source, /label: "Due Balance"/);
  assert.match(source, /Adjust remaining months & days/);
  assert.match(source, /Adjust due months & days/);
});
