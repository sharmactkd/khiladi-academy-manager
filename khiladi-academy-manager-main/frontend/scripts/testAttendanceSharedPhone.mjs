import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseAttendanceSheet } from '../src/utils/attendanceExcelImport.js';
import { directory } from '../src/pages/imports/importLogic.js';

test('siblings sharing a phone retain separate names and marks through directory', () => {
  const name = '26 - Attandance';
  const rows = [
    ['No', 'Name', 'Contact', '', '', '', '', 'Jan-2026'],
    ['', '', '', '', '', '', '', 'Thu', 'Fri'],
    ['', '', '', '', '', '', '', 1, 2],
    [1, 'Prangel Jain', '9897594520', '', '', '', '', 'A', 'P'],
    [2, 'Adi Jain', '9897594520', '', '', '', '', 'P', 'A'],
    [3, 'Princy Kushwah', '9105588877', '', '', '', '', 'A', 'A'],
    [4, 'Sarthak Kushwah', '9105588877', '', '', '', '', 'P', 'P'],
    [2, 'Adi Jain', '9897594520', '', '', '', '', 'P', 'A'],
  ];
  const parsed = parseAttendanceSheet({ Sheets: { [name]: XLSX.utils.aoa_to_sheet(rows) } }, name);
  assert.equal(parsed.rows.length, 4);
  assert.equal(parsed.blocks[0].rows.length, 4);
  assert.deepEqual(parsed.rows.find(r => r.name === 'Adi Jain').attendance.map(a => a.status), ['present', 'absent']);
  assert.deepEqual(parsed.rows.find(r => r.name === 'Sarthak Kushwah').attendance.map(a => a.status), ['present', 'present']);
  assert.equal(directory([], parsed.blocks).length, 4);
});
