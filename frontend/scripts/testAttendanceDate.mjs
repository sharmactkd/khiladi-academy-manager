import test from "node:test";
import assert from "node:assert/strict";

import {
  attendanceDateTimestamp,
  formatAttendanceDate,
  fromAttendanceDateInputValue,
  toAttendanceDateInputValue,
} from "../src/utils/attendanceDate.js";

test("attendance dates use one DD-MM-YYYY display format", () => {
  assert.equal(formatAttendanceDate("2026-09-07T00:00:00.000Z"), "07-09-2026");
  assert.equal(formatAttendanceDate("5/2/26"), "02-05-2026");
  assert.equal(formatAttendanceDate("02-08-26"), "02-08-2026");
  assert.equal(formatAttendanceDate("14-09-2026"), "14-09-2026");
});

test("day-only mode and date input conversion share the same parser", () => {
  assert.equal(formatAttendanceDate("2026-09-07T00:00:00.000Z", { format: "day" }), "07");
  assert.equal(toAttendanceDateInputValue("02-08-2026"), "2026-08-02");
  assert.equal(fromAttendanceDateInputValue("2026-08-02"), "02-08-2026");
});

test("historic text is preserved and day-only values use selected month", () => {
  assert.equal(formatAttendanceDate("25 Days Left"), "25 Days Left");
  assert.equal(formatAttendanceDate("10", { monthDate: "2026-09-01" }), "10");
  assert.equal(attendanceDateTimestamp("10", { monthDate: "2026-09-01" }), Date.UTC(2026, 8, 10));
  assert.equal(attendanceDateTimestamp("31-02-2026"), null);
});
