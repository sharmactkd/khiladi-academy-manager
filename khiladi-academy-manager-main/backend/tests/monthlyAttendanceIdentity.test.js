import test from "node:test";
import assert from "node:assert/strict";

import { buildRowFromRecord, mergeMonthlyRecordIdentity } from "../src/services/monthlyAttendanceService.js";
import { backfillImportedAttendanceMetadata } from "../src/controllers/attendanceController.js";

test("student dates do not fabricate missing fee data", () => {
  const row = buildRowFromRecord({
    identity: { rowType: "student", studentId: "student-1", student: {
      firstName: "Test", joiningDate: "2026-09-01", createdAt: "2026-09-01",
    } }, attendance: {}, index: 0,
  });
  assert.equal(row.feeDueDate, null);
  assert.equal(row.feeStatus, "");
});

test("real imported fee data remains visible", () => {
  const row = buildRowFromRecord({
    identity: { rowType: "student", studentId: "student-1",
      importedDueDate: "10-09-2026", importedFeeStatus: "due" },
    attendance: {}, index: 0,
  });
  assert.equal(row.feeDueDate, "10-09-2026");
  assert.equal(row.feeStatus, "due");
});

test("linked Excel metadata enriches a pre-seeded student roster row", () => {
  const roster = {
    studentId: "student-1",
    rowType: "student",
    source: "manual",
    importedRowNumber: null,
    importedDueDate: "",
    importedPaidDate: "",
    importedFeeStatus: "",
  };
  const imported = {
    studentId: "student-1",
    rowType: "student",
    source: "excel-import",
    importedRowNumber: 17,
    importedSourceSheet: "2024 Attendance",
    importedDueDate: "10",
    importedPaidDate: "15-04-2024",
    importedFeeStatus: "Paid",
  };

  assert.deepEqual(mergeMonthlyRecordIdentity(roster, imported), {
    ...roster,
    source: "excel-import",
    importedRowNumber: 17,
    importedSourceSheet: "2024 Attendance",
    importedDueDate: "10",
    importedPaidDate: "15-04-2024",
    importedFeeStatus: "Paid",
  });
});

test("later attendance days cannot erase or overwrite first imported fee metadata", () => {
  const first = mergeMonthlyRecordIdentity(
    { studentId: "student-1", importedDueDate: "", importedPaidDate: "", importedFeeStatus: "" },
    { studentId: "student-1", importedRowNumber: 25, importedDueDate: "8", importedPaidDate: "12-05-2024", importedFeeStatus: "Paid" }
  );
  const merged = mergeMonthlyRecordIdentity(first, {
    studentId: "student-1",
    importedRowNumber: 40,
    importedDueDate: "",
    importedPaidDate: "",
    importedFeeStatus: "",
  });

  assert.equal(merged.importedRowNumber, 25);
  assert.equal(merged.importedDueDate, "8");
  assert.equal(merged.importedPaidDate, "12-05-2024");
  assert.equal(merged.importedFeeStatus, "Paid");
});

test("missing fields can be completed by another record in the same month", () => {
  const merged = mergeMonthlyRecordIdentity(
    { importedDueDate: "5", importedPaidDate: "", importedFeeStatus: "" },
    { importedDueDate: "9", importedPaidDate: "07-06-2024", importedFeeStatus: "Due" }
  );

  assert.equal(merged.importedDueDate, "5");
  assert.equal(merged.importedPaidDate, "07-06-2024");
  assert.equal(merged.importedFeeStatus, "Due");
});

test("skip-existing backfills fee metadata without changing attendance", () => {
  const existing = {
    status: "present", source: "manual",
    importedDueDate: "", importedPaidDate: "", importedFeeStatus: "",
  };
  const changed = backfillImportedAttendanceMetadata(existing, {
    status: "absent", source: "excel-import",
    importedDueDate: "10", importedPaidDate: "14-07-2024",
    importedFeeStatus: "Paid",
  });

  assert.equal(changed, true);
  assert.equal(existing.status, "present");
  assert.equal(existing.importedDueDate, "10");
  assert.equal(existing.importedPaidDate, "14-07-2024");
  assert.equal(existing.importedFeeStatus, "Paid");
  assert.equal(existing.source, "excel-import");
});

test("backfill never overwrites existing fee metadata", () => {
  const existing = {
    status: "leave", source: "excel-import",
    importedDueDate: "5", importedPaidDate: "08-08-2024",
    importedFeeStatus: "Due",
  };
  assert.equal(backfillImportedAttendanceMetadata(existing, {
    importedDueDate: "20", importedPaidDate: "21-08-2024",
    importedFeeStatus: "Paid",
  }), false);
  assert.equal(existing.importedDueDate, "5");
  assert.equal(existing.importedPaidDate, "08-08-2024");
  assert.equal(existing.importedFeeStatus, "Due");
});
