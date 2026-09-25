import test from "node:test";
import assert from "node:assert/strict";

import { attendanceExportPeriodLabel, filterAttendanceHistoryMonths, validateAttendanceExportScope } from "../src/utils/attendanceHistoryExport.js";

const months = [
  { year: 2024, value: 12 },
  { year: 2025, value: 1 },
  { year: 2025, value: 9 },
  { year: 2026, value: 9 },
];

test("complete attendance export is independent of visible pagination", () => {
  assert.deepEqual(filterAttendanceHistoryMonths(months, { scope: "complete" }), months);
});

test("attendance export supports inclusive month range, year and one month", () => {
  assert.deepEqual(filterAttendanceHistoryMonths(months, { scope: "range", from: "2025-01", to: "2025-09" }), months.slice(1, 3));
  assert.deepEqual(filterAttendanceHistoryMonths(months, { scope: "year", year: "2025" }), months.slice(1, 3));
  assert.deepEqual(filterAttendanceHistoryMonths(months, { scope: "month", month: "2026-09" }), [months[3]]);
});

test("attendance export rejects incomplete or reversed ranges", () => {
  assert.match(validateAttendanceExportScope({ scope: "range", from: "", to: "2025-09" }), /select/i);
  assert.match(validateAttendanceExportScope({ scope: "range", from: "2026-09", to: "2025-09" }), /baad/i);
  assert.equal(validateAttendanceExportScope({ scope: "year", year: "2025" }), "");
  assert.equal(attendanceExportPeriodLabel({ scope: "month", month: "2025-09" }), "2025-09");
});
