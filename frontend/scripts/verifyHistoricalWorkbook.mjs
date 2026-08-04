import fs from "node:fs/promises";
import path from "node:path";
import {
  classifyHistoricalSheets,
  getAttendanceSheetNames,
  parseHistoricalAttendanceSheet,
  parseStudentRecordSheet,
  readAttendanceWorkbook,
} from "../src/utils/attendanceExcelImport.js";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run verify:historical-workbook -- /absolute/path/file.xlsx");
  process.exit(1);
}

const bytes = await fs.readFile(path.resolve(inputPath));
const fileLike = {
  arrayBuffer: async () =>
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
};
const workbook = await readAttendanceWorkbook(fileLike);
const classification = classifyHistoricalSheets(
  getAttendanceSheetNames(workbook)
);
const record = classification.recordSheet
  ? parseStudentRecordSheet(workbook, classification.recordSheet)
  : { rows: [], incompleteRows: [], warnings: ["Record sheet missing"] };

const attendance = classification.attendanceSheets.map((sheetName) => {
  const parsed = parseHistoricalAttendanceSheet(workbook, sheetName);
  return {
    ...parsed.summary,
    warningCount: parsed.warnings.length,
    sampleWarnings: parsed.warnings.slice(0, 8),
  };
});

console.log(
  JSON.stringify(
    {
      classification,
      studentRecord: {
        validRows: record.rows.length,
        historicalOnlyRows: record.incompleteRows.length,
        warnings: record.warnings,
      },
      attendance,
      totalAttendanceRecords: attendance.reduce(
        (sum, item) => sum + item.estimatedAttendanceRecords,
        0
      ),
    },
    null,
    2
  )
);
