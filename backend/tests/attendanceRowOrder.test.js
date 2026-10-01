import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRowOrder,
  moveRowKeys,
  previousMonthPeriod,
  selectMonthlyOrder,
} from "../src/utils/attendanceRowOrder.js";

test("8 to 2 shifts intervening students without dropping anyone", () => {
  const keys = ["a", "b", "c", "d", "e", "f", "g", "ram"];
  assert.deepEqual(moveRowKeys(keys, "ram", 2), ["a", "ram", "b", "c", "d", "e", "f", "g"]);
  assert.equal(keys[7], "ram");
});
test("moving down and to same position keeps complete list", () => {
  assert.deepEqual(moveRowKeys(["a", "b", "c"], "a", 3), ["b", "c", "a"]);
  assert.deepEqual(moveRowKeys(["a", "b", "c"], "b", 2), ["a", "b", "c"]);
});
test("invalid positions and absent students are rejected", () => {
  for (const position of [0, -1, 4, 1.5, NaN, "2"]) assert.throws(() => moveRowKeys(["a", "b", "c"], "a", position));
  assert.throws(() => moveRowKeys(["a"], "missing", 1));
});
test("saved keys reapply after reload without altering marks or imported serial identity", () => {
  const rows = ["a", "b", "ram"].map((key, index) => ({ registerOrderKey: key, importedSerialNo: String(index + 20), attendance: { day: "P" } }));
  const before = JSON.stringify(rows);
  const keys = moveRowKeys(rows.map((row) => row.registerOrderKey), "ram", 1);
  const result = applyRowOrder(rows, keys);
  assert.equal(result[0], rows[2]);
  assert.equal(result[0].importedSerialNo, "22");
  assert.equal(result[0].attendance.day, "P");
  assert.equal(JSON.stringify(rows), before);
});
test("removed keys are ignored, new students append in original order", () => {
  const rows = ["new1", "b", "a", "new2"].map((registerOrderKey) => ({ registerOrderKey }));
  assert.deepEqual(applyRowOrder(rows, ["a", "deleted", "b"]).map((row) => row.registerOrderKey), ["a", "b", "new1", "new2"]);
});

test("October inherits September order as a revision-zero baseline", () => {
  const selected = selectMonthlyOrder({
    currentOrder: null,
    previousOrder: {
      year: 2026,
      month: 9,
      keys: ["student:c", "student:a", "student:b"],
      revision: 7,
      snapshotSource: "explicit-save",
      statuses: [],
    },
    isCurrentRegister: true,
  });
  assert.deepEqual(selected.keys, ["student:c", "student:a", "student:b"]);
  assert.equal(selected.revision, 0);
  assert.equal(selected.inherited, true);
  assert.deepEqual(selected.inheritedFrom, { year: 2026, month: 9 });
});

test("October's own order wins without changing September", () => {
  const september = ["student:c", "student:a", "student:b"];
  const october = ["student:a", "student:b", "student:c"];
  const selected = selectMonthlyOrder({
    currentOrder: { year: 2026, month: 10, keys: october, revision: 2, snapshotSource: "explicit-save", statuses: [] },
    previousOrder: { year: 2026, month: 9, keys: september, revision: 7, snapshotSource: "explicit-save", statuses: [] },
    isCurrentRegister: true,
  });
  assert.deepEqual(selected.keys, october);
  assert.deepEqual(september, ["student:c", "student:a", "student:b"]);
  assert.equal(selected.revision, 2);
  assert.equal(selected.inherited, false);
});

test("historical months never inherit a neighbouring month's order", () => {
  const selected = selectMonthlyOrder({
    currentOrder: null,
    previousOrder: { year: 2026, month: 8, keys: ["student:a"], revision: 1 },
    isCurrentRegister: false,
  });
  assert.deepEqual(selected.keys, []);
  assert.equal(selected.inherited, false);
  assert.deepEqual(previousMonthPeriod(2026, 1), { year: 2025, month: 12 });
  assert.deepEqual(previousMonthPeriod(2026, 10), { year: 2026, month: 9 });
});
