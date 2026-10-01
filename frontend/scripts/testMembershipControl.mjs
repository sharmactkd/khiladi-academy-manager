import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/attendance/MembershipAdjustmentDrawer.jsx", import.meta.url), "utf8");

test("membership controller exposes audited paid and due overrides", () => {
  assert.match(source, /<option value="paid">Paid<\/option>/);
  assert.match(source, /<option value="due">Due<\/option>/);
  assert.doesNotMatch(source, /<option value="partial">/);
  assert.match(source, /Waive outstanding fee/);
  assert.match(source, /Complimentary membership/);
});

test("independent one-click clear controls call their own action and block during saves", () => {
  assert.match(source, /disabled=\{saving \|\| loading\} onClick=\{\(\) => submit\(null, "clear_fee_status"\)\}/);
  assert.match(source, /disabled=\{saving \|\| loading\} onClick=\{\(\) => submit\(null, "clear_due_date"\)\}/);
  assert.match(source, /expectedVersion: membership\?\.version/);
});

test("reason is optional for every membership action and reversal", () => {
  assert.match(source, /Reason <small>\(optional\)<\/small>/);
  assert.doesNotMatch(source, /required=\{form\.type !== "set_due_date"\}/);
  assert.match(source, /Reversal reason \(optional\)/);
});

test("due and remaining month/day adjustments are directly visible", () => {
  assert.match(source, /label: "Remaining Time"/);
  assert.match(source, /label: "Due Balance"/);
  assert.match(source, /Adjust remaining months & days/);
  assert.match(source, /Adjust due months & days/);
});
