import test from "node:test";
import assert from "node:assert/strict";

import { applyCurrentMembershipFeeStatus, buildRowFromRecord, hasMarkedAttendanceCounts, mergeMonthlyRecordIdentity } from "../src/services/monthlyAttendanceService.js";
import { backfillImportedAttendanceMetadata, getImportedAttendancePeriod, isProtectedReconciliationPeriod } from "../src/controllers/attendanceController.js";

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

test("Excel due and paid text is preserved exactly for display", () => {
  const row = buildRowFromRecord({
    identity: {
      rowType: "student",
      studentId: "student-1",
      importedDueDate: "10 DaysExtra",
      importedPaidDate: "1/9/25",
      importedFeeStatus: "DUE",
    },
    attendance: {},
    index: 0,
  });
  assert.equal(row.importedDueDate, "10 DaysExtra");
  assert.equal(row.importedPaidDate, "1/9/25");
});

test("a missing due date never shifts the paid date into the due column", () => {
  const row = buildRowFromRecord({
    identity: {
      rowType: "student",
      studentId: "student-1",
      importedDueDate: "",
      importedPaidDate: "5/2/26",
      importedFeeStatus: "PAID",
    },
    attendance: {},
    index: 0,
    membership: { feeStatus: "due" },
  });
  assert.equal(row.importedDueDate, "");
  assert.equal(row.importedPaidDate, "5/2/26");
  assert.equal(row.feeDueDate, null);
  assert.equal(row.feeStatus, "PAID");
  assert.equal(row.feeStatusSummary, null);
});

test("attendance import period is carried explicitly or recovered from its block id", () => {
  assert.deepEqual(getImportedAttendancePeriod({ importedYear: 2025, importedMonth: 9 }), { year: 2025, month: 9 });
  assert.deepEqual(getImportedAttendancePeriod({ blockId: "25 - Attandance:2025-09" }), { year: 2025, month: 9 });
});

test("temporary reconciliation protects only the selected current-year September", () => {
  assert.equal(isProtectedReconciliationPeriod({ importedYear: 2026, importedMonth: 9 }, true, 2026), true);
  assert.equal(isProtectedReconciliationPeriod({ blockId: "25 - Attandance:2025-09" }, true, 2026), false);
  assert.equal(isProtectedReconciliationPeriod({ importedYear: 2026, importedMonth: 8 }, true, 2026), false);
  assert.equal(isProtectedReconciliationPeriod({ importedYear: 2026, importedMonth: 9 }, false, 2026), false);
});

test("attendance timeline excludes months without P, A, L or LT marks", () => {
  assert.equal(hasMarkedAttendanceCounts({ presentCount: 0, absentCount: 0, leaveCount: 0, lateCount: 0, importedFeeStatus: "PAID" }), false);
  assert.equal(hasMarkedAttendanceCounts({ absentCount: 1 }), true);
  assert.equal(hasMarkedAttendanceCounts({ lateCount: 1 }), true);
});

test("attendance history uses live membership balance only for the current month", () => {
  const months = [
    { year: 2026, value: 8, importedFeeStatus: "DUE" },
    { year: 2026, value: 9, importedFeeStatus: "DUE" },
  ];
  const result = applyCurrentMembershipFeeStatus({
    months,
    membership: { feeStatusSummary: { label: "25M DUE" } },
    todayKey: "2026-09-25",
  });
  assert.equal(result[0].displayFeeStatus, undefined);
  assert.equal(result[0].importedFeeStatus, "DUE");
  assert.equal(result[1].displayFeeStatus, "25M DUE");
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
