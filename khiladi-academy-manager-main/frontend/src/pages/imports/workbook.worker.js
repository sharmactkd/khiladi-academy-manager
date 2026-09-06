import * as XLSX from "xlsx";
import { readRecordGrid } from "../../utils/selectiveWorkbookImport.js";
import { parseHistoricalAttendanceSheet } from "../../utils/attendanceExcelImport.js";
let workbook;
self.onmessage = event => {
  const { requestId, type, buffer, sheet } = event.data;
  try {
    let data;
    if (type === "open") {
      const metadata = XLSX.read(buffer, { type: "array", bookSheets: true, bookProps: true });
      workbook = { SheetNames: metadata.SheetNames, __lazy: true, __buffer: buffer };
      data = { names: metadata.SheetNames };
    } else if (type === "record") data = readRecordGrid(workbook, sheet);
    else if (type === "attendance") data = parseHistoricalAttendanceSheet(workbook, sheet);
    else throw new Error("Unknown workbook operation");
    self.postMessage({ requestId, data });
  } catch (error) { self.postMessage({ requestId, error: error.message || "Worksheet could not be read" }); }
};
