import * as XLSX from "xlsx";
import { buildAutoMapping, buildMappedRows, getStudentDataRange } from "./studentExcelImport.js";
import { attendanceSourceKey } from "./attendanceImportActions.js";

export function readRecordGrid(workbook, sheetName) {
  const loaded = workbook.__lazy ? XLSX.read(workbook.__buffer, {
    type: "array", sheets: [sheetName], cellDates: true,
  }) : workbook;
  const sheet = loaded.Sheets?.[sheetName];
  if (!sheet?.["!ref"]) return { grid: [], headerIndex: 0, warning: "Empty worksheet." };
  const range = getStudentDataRange(sheet);
  const limited = range.e.c > 199 || range.e.r > 99999;
  range.s = { c: 0, r: 0 };
  range.e.c = Math.min(range.e.c, 199);
  range.e.r = Math.min(range.e.r, 99999);
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, range, raw: true, defval: "", blankrows: true });
  let headerIndex = 0, best = 0;
  grid.slice(0, 20).forEach((row, index) => {
    const mapping = buildAutoMapping(row);
    const score = Object.keys(mapping).length + (mapping.name !== undefined || mapping.firstName !== undefined ? 10 : 0);
    if (score > best) { best = score; headerIndex = index; }
  });
  return { grid, headerIndex, warning: limited ? "Preview limited to 200 columns / 100,000 rows. Split the sheet if data extends beyond this range." : "" };
}

export function selectableRecordRows(grid, headerIndex, mapping, sheetName) {
  return grid.slice(headerIndex + 1).flatMap((row, offset) => {
    const mapped = buildMappedRows([row], mapping)[0];
    if (!mapped?.name?.trim()) return [];
    for (const field of ["dateOfBirth", "joiningDate"]) {
      if (mapping[field] !== undefined && mapping[field] !== "") mapped[field] = recordDate(row[Number(mapping[field])]);
    }
    const rowNumber = headerIndex + offset + 2;
    return [{ ...mapped, rowNumber, sourceSheet: sheetName,
      sourceRowKey: `${sheetName}:${rowNumber}`, legacySourceSheets: [sheetName] }];
  });
}

export function recordDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : "";
  }
  const raw = String(value || "").trim();
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!dmy) return raw;
  const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
  const date = new Date(Date.UTC(year, Number(dmy[2]) - 1, Number(dmy[1])));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== Number(dmy[2]) - 1 || date.getUTCDate() !== Number(dmy[1])) return "";
  return date.toISOString().slice(0, 10);
}

// Preserve source keys and full cells. Only explicitly selected student IDs
// can reach the attendance import API, including manually corrected matches.
export function selectedAttendanceTasks(blocks, resolutions, allowedIds) {
  return blocks.flatMap((block) => {
    const rows = (block.rows || []).map((row, index) => ({ ...row,
      importedRowNumber: row.importedRowNumber || row.rowNumber || index + 2,
    })).filter((row) => allowedIds.has(String(resolutions[attendanceSourceKey(row)] || "")));
    const chunks = []; let current = [], bytes = 0;
    for (const row of rows) {
      const size = new TextEncoder().encode(JSON.stringify(row)).length;
      if (current.length && (current.length >= 150 || bytes + size > 900 * 1024)) {
        chunks.push(current); current = []; bytes = 0;
      }
      current.push(row); bytes += size;
    }
    if (current.length) chunks.push(current);
    return chunks.map((chunk) => ({ block, rows: chunk }));
  });
}
