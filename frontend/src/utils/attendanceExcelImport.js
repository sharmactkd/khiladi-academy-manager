import * as XLSX from "xlsx";

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizeKey = (value) =>
  clean(value).toLowerCase().replace(/[_-]+/g, " ");

const normalizePhone = (value) => {
  const raw = clean(value);

  if (!raw || raw === "-" || raw.startsWith("=")) return "";

  return raw.replace(/\D/g, "").slice(-10);
};

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const inferYearFromSheetName = (sheetName = "") => {
  const raw = clean(sheetName);

  const fourDigitMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
  if (fourDigitMatch) return Number(fourDigitMatch[1]);

  const twoDigitMatch = raw.match(/\b(\d{2})\b/);
  if (twoDigitMatch) {
    const value = Number(twoDigitMatch[1]);
    if (value >= 0 && value <= 99) {
      return value >= 70 ? 1900 + value : 2000 + value;
    }
  }

  return new Date().getFullYear();
};

const toFullYear = (value, fallbackYear) => {
  const numeric = Number(value);

  if (!numeric) return fallbackYear;
  if (numeric < 100) return numeric >= 70 ? 1900 + numeric : 2000 + numeric;

  return numeric;
};

const makeDate = ({ day, month, year }) => {
  const numericDay = Number(day);
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    !numericDay ||
    !numericYear ||
    numericMonth < 0 ||
    numericMonth > 11 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(numericYear, numericMonth, numericDay));

  if (
    date.getUTCFullYear() !== numericYear ||
    date.getUTCMonth() !== numericMonth ||
    date.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return date;
};

const toIsoDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeAttendanceStatus = (value) => {
  const raw = clean(value);
  const key = raw.toLowerCase();

  if (!raw || raw === "-") return null;

  if (["p", "present", "1", "yes", "y", "✓", "✔"].includes(key)) {
    return "present";
  }

  if (["a", "absent", "0", "no", "n", "x"].includes(key)) {
    return "absent";
  }

  if (["l", "leave", "lv"].includes(key)) {
    return "leave";
  }

  if (["lt", "late"].includes(key)) {
    return "late";
  }

  return "unknown";
};

const isAttendanceHeaderRow = (row = []) => {
  const first = normalizeKey(row[0]);
  const second = normalizeKey(row[1]);
  const third = normalizeKey(row[2]);

  return (
    ["no", "no.", "s no", "sr no", "sr.no"].includes(first) &&
    ["name", "student name"].includes(second) &&
    ["contact", "phone", "mobile", "mobile number"].includes(third)
  );
};

const isBlankRow = (row = []) => !row.some((cell) => clean(cell));

const isValidStudentRow = (row = []) => {
  const name = clean(row[1]);

  if (!name) return false;
  if (normalizeKey(name) === "name") return false;

  return true;
};

const getLastDayOfMonth = (year, monthIndex) => {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

const parseMonthYearFromHeaderRow = (headerRow = [], fallbackYear) => {
  for (let index = 3; index < headerRow.length; index += 1) {
    const raw = clean(headerRow[index]);

    if (!raw) continue;

    const monthYearMatch = raw.match(
      /\b([A-Za-z]{3,}|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[-/\s](\d{2,4})\b/i
    );

    if (monthYearMatch) {
      const monthText = monthYearMatch[1].toLowerCase();
      const yearText = monthYearMatch[2];
      const month = MONTHS[monthText];

      if (month !== undefined) {
        return {
          month,
          year: toFullYear(yearText, fallbackYear),
          monthHeaderColumn: index,
          source: raw,
        };
      }
    }

    const fullDateMatch = raw.match(
      /^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{2,4})$/i
    );

    if (fullDateMatch) {
      const monthText = fullDateMatch[2].toLowerCase();
      const yearText = fullDateMatch[3];
      const month = MONTHS[monthText];

      if (month !== undefined) {
        return {
          month,
          year: toFullYear(yearText, fallbackYear),
          monthHeaderColumn: index,
          source: raw,
        };
      }
    }
  }

  return null;
};

const findFirstDateColumnFromDayRow = ({
  dateRow = [],
  preferredStart = 3,
}) => {
  for (let index = preferredStart; index < dateRow.length; index += 1) {
    const raw = clean(dateRow[index]);
    const numericDay = Number(raw);

    if (numericDay === 1) {
      return index;
    }
  }

  return -1;
};

const buildDateColumnsFromDayRow = ({
  dateRow = [],
  firstDateColumn,
  month,
  year,
}) => {
  const lastDay = getLastDayOfMonth(year, month);
  const columns = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const columnIndex = firstDateColumn + day - 1;
    const raw = clean(dateRow[columnIndex]);
    const numericDay = Number(raw);

    if (numericDay !== day) continue;

    const date = makeDate({ day, month, year });
    if (!date) continue;

    columns.push({
      index: columnIndex,
      date: toIsoDate(date),
      header: raw,
    });
  }

  return columns;
};

const mergeStudentRows = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key =
      row.phone ||
      row.admissionNumber ||
      normalizeKey(row.name) ||
      `row-${row.importedRowNumber || row.rowNumber}`;

    if (!map.has(key)) {
      map.set(key, {
        ...row,
        attendance: [],
        importedRowNumber: row.importedRowNumber,
      });
    }

    const existing = map.get(key);

    existing.attendance.push(...row.attendance);

    if (!existing.phone && row.phone) existing.phone = row.phone;
    if (!existing.admissionNumber && row.admissionNumber) {
      existing.admissionNumber = row.admissionNumber;
      existing.studentCode = row.admissionNumber;
    }

    if (!existing.importedSerialNo && row.importedSerialNo) {
      existing.importedSerialNo = row.importedSerialNo;
    }

    if (!existing.importedPaidDate && row.importedPaidDate) {
      existing.importedPaidDate = row.importedPaidDate;
    }

    if (!existing.importedFeePaid && row.importedFeePaid) {
      existing.importedFeePaid = row.importedFeePaid;
    }

    if (!existing.importedFeeStatus && row.importedFeeStatus) {
      existing.importedFeeStatus = row.importedFeeStatus;
    }

    if (!existing.importedExtraNote && row.importedExtraNote) {
      existing.importedExtraNote = row.importedExtraNote;
    }
  });

  return Array.from(map.values())
    .map((row) => {
      const seenDates = new Set();

      const attendance = row.attendance.filter((item) => {
        const key = `${item.date}-${item.status}`;

        if (seenDates.has(key)) return false;

        seenDates.add(key);
        return true;
      });

      return {
        ...row,
        attendance,
      };
    })
    .sort((a, b) => Number(a.importedRowNumber || 0) - Number(b.importedRowNumber || 0));
};

export const readAttendanceWorkbook = async (file) => {
  const buffer = await file.arrayBuffer();

  return XLSX.read(buffer, {
    type: "array",
    cellDates: false,
    raw: false,
  });
};

export const getAttendanceSheetNames = (workbook) => workbook?.SheetNames || [];

export const parseAttendanceSheet = (workbook, sheetName) => {
  const worksheet = workbook?.Sheets?.[sheetName];
  const fallbackYear = inferYearFromSheetName(sheetName);

  if (!worksheet) {
    return {
      sheetName,
      rows: [],
      summary: {
        sheetName,
        detectedStudentRows: 0,
        detectedDateColumns: 0,
        estimatedAttendanceRecords: 0,
        detectedYear: fallbackYear,
      },
      warnings: ["Selected sheet not found."],
    };
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const warnings = [];
  const parsedRows = [];
  let totalDateColumns = 0;
  let detectedBlocks = 0;

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex += 1) {
    const headerRow = rawRows[rowIndex];

    if (!isAttendanceHeaderRow(headerRow)) continue;

    const monthInfo = parseMonthYearFromHeaderRow(headerRow, fallbackYear);

    if (!monthInfo) {
      warnings.push(`Row ${rowIndex + 1}: month/year detect nahi hua.`);
      continue;
    }

    const dateRowIndex = rowIndex + 2;
    const dateRow = rawRows[dateRowIndex] || [];

    const firstDateColumn = findFirstDateColumnFromDayRow({
      dateRow,
      preferredStart: monthInfo.monthHeaderColumn,
    });

    if (firstDateColumn < 0) {
      warnings.push(`Row ${rowIndex + 1}: date start column detect nahi hua.`);
      continue;
    }

    const dateColumns = buildDateColumnsFromDayRow({
      dateRow,
      firstDateColumn,
      month: monthInfo.month,
      year: monthInfo.year,
    });

    if (!dateColumns.length) {
      warnings.push(`Row ${rowIndex + 1}: date columns detect nahi hue.`);
      continue;
    }

    detectedBlocks += 1;
    totalDateColumns += dateColumns.length;

    let dataRowIndex = rowIndex + 3;

    while (dataRowIndex < rawRows.length) {
      const row = rawRows[dataRowIndex];

      if (isBlankRow(row)) break;
      if (isAttendanceHeaderRow(row)) break;

      if (!isValidStudentRow(row)) {
        dataRowIndex += 1;
        continue;
      }

      const attendance = [];

      dateColumns.forEach((column) => {
        const raw = clean(row[column.index]);
        const status = normalizeAttendanceStatus(raw);

        if (!status) return;

        if (status === "unknown") {
          if (warnings.length < 30) {
            warnings.push(
              `Row ${dataRowIndex + 1}, ${column.date}: "${raw}" ignored.`
            );
          }
          return;
        }

        attendance.push({
          date: column.date,
          status,
          raw,
        });
      });

      const name = clean(row[1]);
      const phone = normalizePhone(row[2]);
      const admissionNumber = "";

      if (name || phone || attendance.length) {
        parsedRows.push({
          rowNumber: dataRowIndex + 1,
          importedRowNumber: dataRowIndex + 1,
          importedSerialNo: clean(row[0]),
          name,
          phone,
          admissionNumber,
          studentCode: admissionNumber,
          batchName: "",
          importedPaidDate: clean(row[3]),
          importedFeePaid: clean(row[4]),
          importedFeeStatus: clean(row[5]),
          importedExtraNote: clean(row[6]),
          attendance,
        });
      }

      dataRowIndex += 1;
    }
  }

  const rows = mergeStudentRows(parsedRows);

  const estimatedAttendanceRecords = rows.reduce(
    (sum, row) => sum + row.attendance.length,
    0
  );

  if (!detectedBlocks) {
    warnings.push("Attendance month blocks detect nahi hue.");
  }

  if (!estimatedAttendanceRecords) {
    warnings.push("P/A attendance records detect nahi hue.");
  }

  return {
    sheetName,
    rows,
    summary: {
      sheetName,
      detectedBlocks,
      detectedStudentRows: rows.length,
      detectedDateColumns: totalDateColumns,
      estimatedAttendanceRecords,
      detectedYear: fallbackYear,
      nameColumn: "NAME",
      phoneColumn: "Contact",
    },
    warnings,
  };
};