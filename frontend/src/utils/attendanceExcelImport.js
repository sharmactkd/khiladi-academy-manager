import * as XLSX from "xlsx";

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizeKey = (value) =>
  clean(value).toLowerCase().replace(/[_-]+/g, " ");

const normalizePhone = (value) => {
  const raw = clean(value);
  if (!raw || raw === "-") return "";
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

  const twoDigitMatch = raw.match(/\b(\d{2})\b/);
  if (twoDigitMatch) {
    const value = Number(twoDigitMatch[1]);
    if (value >= 0 && value <= 99) {
      return value >= 70 ? 1900 + value : 2000 + value;
    }
  }

  const fourDigitMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
  if (fourDigitMatch) {
    return Number(fourDigitMatch[1]);
  }

  return new Date().getFullYear();
};

const excelSerialToDate = (serial) => {
  if (!serial || Number.isNaN(Number(serial))) return null;

  const parsed = XLSX.SSF.parse_date_code(Number(serial));

  if (!parsed?.y || !parsed?.m || !parsed?.d) return null;

  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
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

const parseDateValue = (value, fallbackYear) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year =
      value.getFullYear() >= 1990 ? value.getFullYear() : fallbackYear;

    return makeDate({
      day: value.getDate(),
      month: value.getMonth(),
      year,
    });
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const raw = clean(value);

  if (!raw || raw === "-") return null;

  const ddMmmWithYear = raw.match(
    /^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{2,4})$/
  );

  if (ddMmmWithYear) {
    const [, day, monthText, yearText] = ddMmmWithYear;
    const month = MONTHS[monthText.toLowerCase()];
    const year =
      yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);

    return makeDate({ day, month, year });
  }

  const ddMmmWithoutYear = raw.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})$/);

  if (ddMmmWithoutYear) {
    const [, day, monthText] = ddMmmWithoutYear;
    const month = MONTHS[monthText.toLowerCase()];

    return makeDate({ day, month, year: fallbackYear });
  }

  const ddMmYyyy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);

  if (ddMmYyyy) {
    const [, day, monthText, yearText] = ddMmYyyy;
    const year =
      yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);

    return makeDate({
      day,
      month: Number(monthText) - 1,
      year,
    });
  }

  const ddMmWithoutYear = raw.match(/^(\d{1,2})[-/](\d{1,2})$/);

  if (ddMmWithoutYear) {
    const [, day, monthText] = ddMmWithoutYear;

    return makeDate({
      day,
      month: Number(monthText) - 1,
      year: fallbackYear,
    });
  }

  const mmmDdWithYear = raw.match(
    /^([A-Za-z]{3,})[-/\s](\d{1,2})[-/\s](\d{2,4})$/
  );

  if (mmmDdWithYear) {
    const [, monthText, day, yearText] = mmmDdWithYear;
    const month = MONTHS[monthText.toLowerCase()];
    const year =
      yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);

    return makeDate({ day, month, year });
  }

  const mmmDdWithoutYear = raw.match(/^([A-Za-z]{3,})[-/\s](\d{1,2})$/);

  if (mmmDdWithoutYear) {
    const [, monthText, day] = mmmDdWithoutYear;
    const month = MONTHS[monthText.toLowerCase()];

    return makeDate({ day, month, year: fallbackYear });
  }

  return null;
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

const isBlankRow = (row = []) => {
  return !row.some((cell) => clean(cell));
};

const isValidStudentRow = (row = []) => {
  const no = clean(row[0]);
  const name = clean(row[1]);

  if (!name) return false;
  if (normalizeKey(name) === "name") return false;
  if (normalizeKey(no) === "no.") return false;

  return true;
};

const getDateColumnsFromDateRow = (dateRow = [], fallbackYear) => {
  return dateRow
    .map((cell, index) => {
      const date = parseDateValue(cell, fallbackYear);

      if (!date) return null;

      return {
        index,
        date: toIsoDate(date),
        header: clean(cell),
      };
    })
    .filter(Boolean);
};

const mergeStudentRows = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key =
      row.phone ||
      row.admissionNumber ||
      normalizeKey(row.name) ||
      `row-${row.rowNumber}`;

    if (!map.has(key)) {
      map.set(key, {
        ...row,
        attendance: [],
      });
    }

    const existing = map.get(key);

    existing.attendance.push(...row.attendance);

    if (!existing.phone && row.phone) existing.phone = row.phone;
    if (!existing.admissionNumber && row.admissionNumber) {
      existing.admissionNumber = row.admissionNumber;
      existing.studentCode = row.admissionNumber;
    }
  });

  return Array.from(map.values()).map((row) => {
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
  });
};

export const readAttendanceWorkbook = async (file) => {
  const buffer = await file.arrayBuffer();

  return XLSX.read(buffer, {
    type: "array",
    cellDates: true,
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
  });

  const warnings = [];
  const parsedRows = [];
  let totalDateColumns = 0;
  let detectedBlocks = 0;

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex += 1) {
    const headerRow = rawRows[rowIndex];

    if (!isAttendanceHeaderRow(headerRow)) {
      continue;
    }

    const dateRowIndex = rowIndex + 2;
    const dateRow = rawRows[dateRowIndex] || [];
    const dateColumns = getDateColumnsFromDateRow(dateRow, fallbackYear);

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

      const name = clean(row[1]);
      const phone = normalizePhone(row[2]);
      const admissionNumber = "";
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

      if (name || phone || attendance.length) {
        parsedRows.push({
          rowNumber: dataRowIndex + 1,
          name,
          phone,
          admissionNumber,
          studentCode: admissionNumber,
          batchName: "",
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