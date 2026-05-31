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

const excelSerialToDate = (serial) => {
  if (!serial || Number.isNaN(Number(serial))) return null;

  const utcDays = Math.floor(Number(serial) - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);

  if (Number.isNaN(dateInfo.getTime())) return null;

  return new Date(
    Date.UTC(
      dateInfo.getUTCFullYear(),
      dateInfo.getUTCMonth(),
      dateInfo.getUTCDate()
    )
  );
};

const parseDateValue = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
    );
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const raw = clean(value);

  if (!raw || raw === "-") return null;

  const direct = new Date(raw);

  if (!Number.isNaN(direct.getTime())) {
    return new Date(
      Date.UTC(direct.getFullYear(), direct.getMonth(), direct.getDate())
    );
  }

  const ddMmmYyyy = raw.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{2,4})$/);

  if (ddMmmYyyy) {
    const [, dd, mmm, yyyy] = ddMmmYyyy;
    const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    const parsed = new Date(`${dd} ${mmm} ${year}`);

    if (!Number.isNaN(parsed.getTime())) {
      return new Date(
        Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      );
    }
  }

  const ddMmYyyy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);

  if (ddMmYyyy) {
    const [, dd, mm, yyyy] = ddMmYyyy;
    const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    const parsed = new Date(Date.UTC(Number(year), Number(mm) - 1, Number(dd)));

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
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

const getDateColumnsFromDateRow = (dateRow = []) => {
  return dateRow
    .map((cell, index) => {
      const date = parseDateValue(cell);

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

  if (!worksheet) {
    return {
      sheetName,
      rows: [],
      summary: {
        sheetName,
        detectedStudentRows: 0,
        detectedDateColumns: 0,
        estimatedAttendanceRecords: 0,
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
    const dateColumns = getDateColumnsFromDateRow(dateRow);

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
      nameColumn: "NAME",
      phoneColumn: "Contact",
    },
    warnings,
  };
};