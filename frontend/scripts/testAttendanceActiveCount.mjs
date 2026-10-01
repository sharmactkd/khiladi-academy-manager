import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/pages/attendance/Attendance.jsx", import.meta.url), "utf8");

test("attendance overview reports active students instead of every loaded row", () => {
  assert.match(source, /const activeStudentCount = useMemo/);
  assert.match(source, /String\(row\.status \|\| ""\)\.toLowerCase\(\) === "active"/);
  assert.match(source, /<small>Active Students<\/small><strong>\{activeStudentCount\}<\/strong>/);
  assert.doesNotMatch(source, /<small>Total Students<\/small><strong>\{formattedRows\.length\}<\/strong>/);
});
