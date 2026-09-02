import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { readRecordGrid, selectableRecordRows, selectedAttendanceTasks, recordDate } from '../src/utils/selectiveWorkbookImport.js';
import { buildAutoMapping, getDefaultStudentSheet, getStudentDataRange } from '../src/utils/studentExcelImport.js';
import { attendanceSourceKey, chunkAttendanceResolutions } from '../src/utils/attendanceImportActions.js';

const book = XLSX.utils.book_new();
assert.equal(getDefaultStudentSheet(['26 - Attandance', 'Balance', 'Record']), 'Record');
assert.equal(getDefaultStudentSheet(['Attendance', 'Student Records']), 'Student Records');
assert.deepEqual(buildAutoMapping(["Father's Name", 'School / College']), { parentName: '0', schoolName: '1' });
assert.deepEqual(getStudentDataRange({ '!ref': 'A1:XFD999', A1: { v: 'Name' }, B2: { v: 'Example' }, XFD999: { t: 'z' } }), { s: { r: 0, c: 0 }, e: { r: 1, c: 1 } });
XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
  ['Academy records'],
  ['Name', 'DOB', 'School Name', 'Belt Rank', 'Parent Phone', 'School Class'],
  ['Prachi', '12/03/2012', 'Central School', 'Yellow', '9876543210', '7'],
  [],
  ['Prachi', '15/06/2013', 'Other School', 'Green', '9876543211', '6'],
]), 'Record');
const parsed = readRecordGrid(book, 'Record');
assert.equal(parsed.headerIndex, 1);
const rows = selectableRecordRows(parsed.grid, parsed.headerIndex, buildAutoMapping(parsed.grid[1]), 'Record');
assert.equal(rows.length, 2);
assert.equal(rows[0].schoolName, 'Central School');
assert.equal(rows[0].beltRank, 'Yellow');
assert.equal(rows[0].parentPhone, '9876543210');
assert.equal(rows[0].className, '7');
assert.equal(rows[0].dateOfBirth, '2012-03-12');
assert.equal(rows[1].sourceRowKey, 'Record:5');
assert.notEqual(rows[0].sourceRowKey, rows[1].sourceRowKey);
assert.equal(recordDate('31/02/2020'), '');
assert.equal(recordDate(''), '');
assert.equal(recordDate(43831), '2020-01-01');
const source = Array.from({length: 302}, (_, i) => ({name: `Player ${i}`, sourceSheet: 'Jan', attendance: {1: 'P'}, dueDate: '2026-01-10'}));
const resolutions = Object.fromEntries(source.map((row, i) => [attendanceSourceKey(row, i), i % 2 ? 'unselected' : 'selected']));
const tasks = selectedAttendanceTasks([{blockId: 'Jan', rows: source}], resolutions, new Set(['selected']));
assert.equal(tasks.length, 2);
assert.equal(tasks[0].rows.length, 150);
assert.equal(tasks[1].rows.length, 1);
assert.equal(tasks[0].rows[1].importedRowNumber, 4);
for (const task of tasks) {
  assert.ok(Object.values(chunkAttendanceResolutions(task.rows, resolutions)).every(id => id === 'selected'));
  assert.equal(task.rows[0].dueDate, '2026-01-10');
  assert.deepEqual(task.rows[0].attendance, {1: 'P'});
}
assert.deepEqual(selectedAttendanceTasks([{rows: source}], resolutions, new Set()), []);
console.log('PASS: full mapped fields, physical row identity, dates, selected-only scope and safe attendance chunks');
