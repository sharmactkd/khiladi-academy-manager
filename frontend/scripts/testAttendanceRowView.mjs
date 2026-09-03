import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAttendanceRowView, cycleAttendanceSort, dueDateSortValue, patchAttendanceRow, getFeeStatusValue } from "../src/components/attendance/attendanceRowView.js";

test("unpaid months display in fee status while table requests date-only membership badge", () => {
  const row = {rowType:'student', studentId:'prachi', feeStatus:'Due', membership:{unpaidMonths:24, effectiveDueDate:'2026-09-15'}};
  assert.equal(getFeeStatusValue(row), '24M DUE');
  assert.equal(dueDateSortValue(row), Date.UTC(2026,8,15));
  assert.equal(getFeeStatusValue({...row,membership:{unpaidMonths:0}}), 'DUE');
  assert.equal(getFeeStatusValue({...row,membership:{unpaidMonths:1}}), 'DUE');
  assert.equal(getFeeStatusValue({...row,membership:{unpaidMonths:2}}), '2M DUE');
  const source = readFileSync(new URL('../src/components/attendance/AttendanceTable.jsx',import.meta.url),'utf8');
  assert.match(source, /<MembershipBadge\s+dateOnly/);
});

const rows = [
  { studentId: "a", rowType: "student", name: "Asha", contact: "9876-54-3210", admissionNumber: "ADM-101", feeDueDate: "2026-09-20", feeStatus: "Paid", attendance: { "2026-09-01": "P" } },
  { studentId: "b", rowType: "student", name: "Prachi Jain", feeDueDate: "02-09-2026", feeStatus: "Due", attendance: { "2026-09-01": "A" } },
  { rowType: "raw-import", importedName: "Adi Jain", importedDueDate: "-", importedFeeStatus: "-", attendance: {} },
].map((row) => ({ status: "active", ...row }));
const indices = (query, sort) => buildAttendanceRowView(rows, query, sort).map((entry) => entry.sourceIndex);
test("single sort cycles ascending, descending, neutral", () => {
  let sort = cycleAttendanceSort([], "dueDate");
  assert.deepEqual(sort, [{ key: "dueDate", direction: "asc" }]);
  sort = cycleAttendanceSort(sort, "dueDate");
  assert.equal(sort[0].direction, "desc");
  sort = cycleAttendanceSort(sort, "dueDate");
  assert.deepEqual(sort, []);
  assert.deepEqual(indices("", sort), [0, 1, 2]);
});
test("Ctrl sort preserves priority, cycles just one column, and normal click replaces other sorts", () => {
  let sort = cycleAttendanceSort([], "feeStatus", true);
  sort = cycleAttendanceSort(sort, "dueDate", true);
  assert.deepEqual(sort.map((s) => s.key), ["feeStatus", "dueDate"]);
  sort = cycleAttendanceSort(sort, "feeStatus", true);
  assert.equal(sort[0].direction, "desc");
  assert.equal(sort[1].direction, "asc");
  sort = cycleAttendanceSort(sort, "feeStatus", true);
  assert.deepEqual(sort, [{ key: "dueDate", direction: "asc" }]);
  assert.deepEqual(cycleAttendanceSort(sort, "feeStatus"), [{ key: "feeStatus", direction: "asc" }]);
});
test("multiple sort applies secondary key only within equal primary values", () => {
  const data = [
    { feeStatus: "Paid", feeDueDate: "2026-09-02" },
    { feeStatus: "Due", feeDueDate: "2026-09-20" },
    { feeStatus: "Due", feeDueDate: "2026-09-01" },
    { feeStatus: "Paid", feeDueDate: "2026-09-01" },
    { feeStatus: "Due", feeDueDate: "-" },
  ].map((row) => ({ status: "active", ...row }));
  const sorts = [{ key: "feeStatus", direction: "asc" }, { key: "dueDate", direction: "desc" }];
  assert.deepEqual(buildAttendanceRowView(data, "", sorts).map((x) => x.sourceIndex), [1, 2, 4, 0, 3]);
  assert.deepEqual(buildAttendanceRowView(data, "", [...sorts].reverse()).map((x) => x.sourceIndex), [1, 0, 2, 3, 4]);
});
test("blank primary values still use the secondary key", () => {
  const data = [{ status: "active", feeStatus: "Paid" }, { status: "active", feeStatus: "Due" }];
  assert.deepEqual(buildAttendanceRowView(data, "", [{ key: "dueDate" }, { key: "feeStatus" }]).map((x) => x.sourceIndex), [1, 0]);
});
test("search lives in batch/year controls, not a duplicate toolbar", () => {
  const source = readFileSync(new URL("../src/pages/attendance/Attendance.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /attendance-search-toolbar/);
  const controls = readFileSync(new URL("../src/components/attendance/AttendanceControls.jsx", import.meta.url), "utf8");
  assert.match(controls, /Search attendance students/);
});
test("active rows sort first; inactive follow, then unknown/raw-import rows", () => {
  const data = [
    { status: "active", feeDueDate: "2026-09-20", feeStatus: "Paid" },
    { status: "inactive", feeDueDate: "2026-09-01", feeStatus: "Due" },
    { status: "active", feeDueDate: "2026-09-02", feeStatus: "Due" },
    { status: "active", rowType: "raw-import", feeDueDate: "2026-09-01" },
    { feeDueDate: "2026-09-01" },
  ];
  const before = JSON.stringify(data);
  for (const sorts of [[{ key: "dueDate" }], [{ key: "feeStatus" }, { key: "dueDate", direction: "desc" }]]) {
    const result = buildAttendanceRowView(data, "", sorts);
    assert.deepEqual(result.map((x) => x.sourceIndex), [2, 0, 1, 3, 4]);
    assert.equal(result[2].row, data[1]);
    assert.equal(result[3].row, data[3]);
  }
  assert.deepEqual(buildAttendanceRowView(data, "", []).map((x) => x.sourceIndex), [0, 2, 1, 3, 4]);
  assert.equal(JSON.stringify(data), before);
});
test("inactive-only searches preserve source order even when sorting is enabled", () => {
  const data = [{ name: "Old A", status: "inactive", feeStatus: "Paid" }, { name: "Old B", status: "inactive", feeStatus: "Due" }];
  assert.deepEqual(buildAttendanceRowView(data, "Old", [{ key: "feeStatus" }]).map((x) => x.sourceIndex), [0, 1]);
});
test("search names, imported names, formatted/unformatted phones and admission", () => {
  assert.deepEqual(indices("jAiN"), [1, 2]);
  assert.deepEqual(indices("987654"), [0]);
  assert.deepEqual(indices("9876-54"), [0]);
  assert.deepEqual(indices("ADM-101"), [0]);
  assert.deepEqual(indices("absent person"), []);
  assert.deepEqual(indices("  "), [0, 1, 2]);
});
test("dates sort chronologically both ways, blanks last", () => {
  assert.deepEqual(indices("", { key: "dueDate", direction: "asc" }), [1, 0, 2]);
  assert.deepEqual(indices("", { key: "dueDate", direction: "desc" }), [0, 1, 2]);
});
test("fee status sorts by displayed label, blanks last both ways", () => {
  assert.deepEqual(indices("", { key: "feeStatus", direction: "asc" }), [1, 0, 2]);
  assert.deepEqual(indices("", { key: "feeStatus", direction: "desc" }), [0, 1, 2]);
  const raw = [{ rowType: "raw-import", feeStatus: "Paid", importedFeeStatus: "Due" }, rows[0]];
  assert.equal(buildAttendanceRowView(raw, "", { key: "feeStatus" })[0].sourceIndex, 1);
});
test("newly inactive row moves directly below last active, retaining edit identity", () => {
  const data = [
    {studentId:'old', status:'inactive', statusUpdatedAt:'2026-01-01'},
    {studentId:'a', status:'active'},
    {studentId:'changed', status:'inactive', statusUpdatedAt:'2026-09-03'},
    {studentId:'b', status:'active'},
  ];
  const result = buildAttendanceRowView(data);
  assert.deepEqual(result.map(x=>x.row.studentId), ['a','b','changed','old']);
  assert.equal(result[2].sourceIndex, 2);
  const reactivated = data.map(r=>r.studentId === 'changed' ? {...r,status:'active'} : r);
  assert.deepEqual(buildAttendanceRowView(reactivated).map(x=>x.row.studentId), ['a','changed','b','old']);
});
test("membership effective due date takes precedence; day-only legacy data uses selected month", () => {
  assert.equal(dueDateSortValue({ ...rows[0], membership: { effectiveDueDate: "2026-09-01" } }), Date.UTC(2026, 8, 1));
  assert.equal(dueDateSortValue({ importedDueDate: "9" }, "2026-09-01"), Date.UTC(2026, 8, 9));
  assert.equal(dueDateSortValue({ importedDueDate: "09/02/2026" }), Date.UTC(2026, 8, 2));
  assert.equal(dueDateSortValue({ importedDueDate: "31-02-2026" }), null);
  assert.equal(dueDateSortValue({ importedDueDate: "Not set" }), null);
});
test("filter + sort + edit preserves hidden rows and targets original source row", () => {
  const before = JSON.stringify(rows);
  const view = buildAttendanceRowView(rows, "Prachi", { key: "dueDate" });
  const updated = patchAttendanceRow(rows, view[0].sourceIndex, (row) => ({ ...row, attendance: { ...row.attendance, "2026-09-01": "P" } }));
  assert.equal(updated.length, 3);
  assert.equal(updated[1].studentId, "b");
  assert.equal(updated[1].attendance["2026-09-01"], "P");
  assert.equal(updated[0], rows[0]);
  assert.equal(updated[2], rows[2]);
  assert.equal(JSON.stringify(rows), before);
});
test("equal dates stay stable and default order is unchanged", () => {
  assert.deepEqual(indices(""), [0, 1, 2]);
  const equal = [rows[0], { ...rows[0], studentId: "c" }];
  assert.deepEqual(buildAttendanceRowView(equal, "", { key: "dueDate", direction: "desc" }).map((r) => r.sourceIndex), [0, 1]);
});
test("imports removed from both pages while central route remains", () => {
  for (const path of ["students/Students.jsx", "attendance/Attendance.jsx"]) {
    const source = readFileSync(new URL(`../src/pages/${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /ImportModal|importModalOpen|Import Excel|Import Attendance|handleImportStudents|handleImportAttendance/);
  }
  assert.match(readFileSync(new URL("../src/routes/AppRoutes.jsx", import.meta.url), "utf8"), /path="\/imports"/);
});
