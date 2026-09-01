import test from "node:test";
import assert from "node:assert/strict";
import { buildAttendanceImportResolutions, chunkAttendanceResolutions, attendanceSourceKey, provisionalStudentValues } from "../src/utils/attendanceImportActions.js";

test("transport only includes the current chunk's verified source keys", () => {
  const row = { sourceSheet: "2025 Attendance", rowNumber: 5, phone: "+91 99999-99999", name: "Prachi (old)" };
  const key = attendanceSourceKey(row);
  assert.equal(key, "2025 attendance::5::9999999999::prachi");
  assert.deepEqual(chunkAttendanceResolutions([row], { [key]: "s1", unrelated: "s2" }), { [key]: "s1" });
  assert.throws(() => chunkAttendanceResolutions([row], {}), /no reviewed identity/);
});

test("matched-only pins confirmed identities and skips only unresolved/excluded rows", () => {
  const groups = [
    { studentId: "s1", rowKeys: ["a", "b"] },
    { studentId: "", rowKeys: ["c"], excluded: false },
    { studentId: "", rowKeys: ["d"], excluded: true },
  ];
  const before = JSON.stringify(groups);
  assert.deepEqual(buildAttendanceImportResolutions(groups, true), { a: "s1", b: "s1", c: "__skip__", d: "__skip__" });
  assert.equal(JSON.stringify(groups), before);
  assert.throws(() => buildAttendanceImportResolutions(groups), /Confirm or exclude/);
});

test("full import accepts resolved and explicitly excluded groups", () => {
  assert.deepEqual(buildAttendanceImportResolutions([
    { studentId: "s1", rowKeys: ["a"] },
    { excluded: true, rowKeys: ["b"] },
  ]), { a: "s1", b: "__skip__" });
});

test("bulk new records use source names without inventing profile information", () => {
  assert.deepEqual(provisionalStudentValues({ sources: [{ name: " Prachi Wo " }] }), {
    firstName: "Prachi", lastName: "Wo", status: "inactive",
  });
  assert.throws(() => provisionalStudentValues({ name: "" }), /correct/);
  assert.throws(() => provisionalStudentValues({ name: "x".repeat(101) }), /correct/);
});
