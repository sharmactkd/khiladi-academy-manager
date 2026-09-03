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

  // H marks a holiday/non-class day in the supplied historical workbook. It
  // is intentionally not converted into an absence or attendance record.
  if (["h", "holiday", "off"].includes(key)) return null;

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
    // A contact number may belong to a parent and be shared by siblings.
    // Never collapse different names (or conflicting identifiers) by phone.
    const name = normalizeKey(row.name);
    const key = name
      ? JSON.stringify([name, normalizePhone(row.phone), normalizeKey(row.admissionNumber)])
      : JSON.stringify([row.sourceSheet, row.importedRowNumber || row.rowNumber]);

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

    if (!existing.importedDueDate && row.importedDueDate) {
      existing.importedDueDate = row.importedDueDate;
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

  // The historical workbook contains a few accidentally formatted sheets whose
  // used range reaches XFD. Reading every worksheet eagerly can consume hundreds
  // of MB in the browser. The first pass therefore reads workbook metadata only.
  const metadata = XLSX.read(buffer, {
    type: "array",
    bookSheets: true,
    bookProps: true,
  });

  return {
    SheetNames: metadata.SheetNames || [],
    __buffer: buffer,
    __lazy: true,
  };
};

export const loadAttendanceWorksheet = (workbook, sheetName) => {
  if (!workbook?.__lazy) return workbook;

  return XLSX.read(workbook.__buffer, {
    type: "array",
    cellDates: false,
    raw: false,
    sheets: [sheetName],
  });
};

export const getAttendanceSheetNames = (workbook) => workbook?.SheetNames || [];

export const isHistoricalAttendanceSheet = (sheetName = "") =>
  /^\s*\d{2,4}\s*-\s*att(?:e|a)ndance\s*$/i.test(clean(sheetName));

export const isStudentRecordSheet = (sheetName = "") =>
  normalizeKey(sheetName) === "record";

export const classifyHistoricalSheets = (sheetNames = []) => ({
  recordSheet: sheetNames.find(isStudentRecordSheet) || "",
  attendanceSheets: sheetNames.filter(isHistoricalAttendanceSheet),
  ignoredSheets: sheetNames.filter(
    (name) => !isStudentRecordSheet(name) && !isHistoricalAttendanceSheet(name)
  ),
});

const excelSerialToIsoDate = (value) => {
  const raw = clean(value);
  if (!raw || raw === "-") return "";

  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (!Number.isFinite(serial) || serial <= 0) return "";
    const parsed = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
    return toIsoDate(parsed);
  }

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return "";
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const month = Number(match[2]);
  const day = Number(match[1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return toIsoDate(date);
};

export const parseStudentRecordSheet = (workbook, sheetName = "Record") => {
  const loadedWorkbook = loadAttendanceWorksheet(workbook, sheetName);
  const worksheet = loadedWorkbook?.Sheets?.[sheetName];
  if (!worksheet) {
    return { rows: [], incompleteRows: [], warnings: ["Record sheet not found."] };
  }

  // Record's real data is A:AH. Columns beyond that are accidental formatting.
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    range: "A1:AH10000",
    defval: "",
    raw: true,
    blankrows: false,
  });

  const rows = [];
  const incompleteRows = [];

  rawRows.slice(2).forEach((row, index) => {
    const rowNumber = index + 3;
    const serialNo = clean(row[0]);
    const name = clean(row[1]);
    if (!name || normalizeKey(name) === "name") return;

    const dateOfBirth = excelSerialToIsoDate(row[4]);
    const joiningDate = excelSerialToIsoDate(row[7]);
    const payload = {
      rowNumber,
      studentCode: serialNo ? `LEGACY-GROUND-${serialNo}` : "",
      admissionNumber: serialNo ? `LEGACY-GROUND-${serialNo}` : "",
      name,
      parentName: clean(row[2]) === "-" ? "" : clean(row[2]),
      phone: normalizePhone(row[3]),
      dateOfBirth,
      address: clean(row[5]) === "-" ? "" : clean(row[5]),
      schoolName: clean(row[6]) === "-" ? "" : clean(row[6]),
      joiningDate,
      beltRank: clean(row[9]) === "-" ? "" : clean(row[9]),
      martialArt: "Taekwondo",
      gender: "other",
      status: "inactive",
      sourceSheet: sheetName,
      legacySourceSheets: [sheetName],
      importSource: "excel-record",
      profileStatus: "incomplete",
      profileIncompleteFields: ["gender", ...(!dateOfBirth ? ["dateOfBirth"] : [])],
      notes: "Imported from Ground.xlsx Record sheet; gender requires review.",
    };

    if (!dateOfBirth) {
      incompleteRows.push({
        ...payload,
        reason: "DOB missing/invalid; provisional profile will be created.",
      });
    }

    rows.push(payload);
  });

  return {
    rows,
    incompleteRows,
    warnings: incompleteRows.length
      ? [`${incompleteRows.length} Record rows have no valid DOB; provisional profiles will keep DOB blank.`]
      : [],
  };
};

const stableLegacyCode = (value) => {
  let hash = 2166136261;
  const input = normalizeKey(value) || "unknown";
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase();
};

export const buildProvisionalStudentsFromAttendance = (
  parsedSheets = [],
  { fallbackBatchName = "" } = {}
) => {
  const identities = new Map();
  parsedSheets.forEach((parsedSheet) => {
    (parsedSheet?.rows || []).forEach((row) => {
      const name = clean(row.name);
      const phone = normalizePhone(row.phone);
      if (!name && !phone) return;
      const normalizedName = normalizeKey(name);
      const identityKey = phone
        ? `name-phone:${normalizedName}:${phone}`
        : `name:${normalizedName}`;
      const existing = identities.get(identityKey);
      const sheetName = clean(row.sourceSheet || parsedSheet.sheetName);
      if (existing) {
        existing.legacySourceSheets = [...new Set([
          ...existing.legacySourceSheets,
          ...(sheetName ? [sheetName] : []),
        ])];
        return;
      }
      const legacyCode = `LEGACY-ATT-${stableLegacyCode(identityKey)}`;
      identities.set(identityKey, {
        rowNumber: row.rowNumber,
        admissionNumber: legacyCode,
        studentCode: legacyCode,
        name: name || `Student ${phone.slice(-4)}`,
        phone,
        dateOfBirth: "",
        gender: "",
        batchName: fallbackBatchName,
        martialArt: "Taekwondo",
        status: "inactive",
        importSource: "excel-attendance",
        profileStatus: "incomplete",
        profileIncompleteFields: ["dateOfBirth", "gender"],
        legacySourceSheets: sheetName ? [sheetName] : [],
        notes: "Provisional profile created from historical attendance. DOB and gender require review.",
      });
    });
  });
  return Array.from(identities.values());
};

export const parseHistoricalAttendanceSheet = (workbook, sheetName) =>
  parseAttendanceSheet(loadAttendanceWorksheet(workbook, sheetName), sheetName);

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
    // Historical attendance data is confined to A:AN. Several source sheets
    // accidentally report XFD as their used column, which would otherwise make
    // sheet_to_json iterate millions of empty cells.
    range: "A1:AN10000",
    defval: "",
    raw: false,
    blankrows: false,
  });

  const warnings = [];
  const parsedRows = [];
  const blocks = [];
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
    const blockRows = [];

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
        const parsedStudentRow = {
          sourceSheet: sheetName,
          rowNumber: dataRowIndex + 1,
          importedRowNumber: dataRowIndex + 1,
          importedSerialNo: clean(row[0]),
          name,
          phone,
          admissionNumber,
          studentCode: admissionNumber,
          batchName: "",
          // In the supplied legacy workbook column D is labelled "Paid Date"
          // but contains the due day/date. Column E contains the actual paid
          // date. Store both explicitly so they cannot be swapped in the UI.
          importedDueDate: clean(row[3]),
          importedPaidDate: clean(row[4]),
          importedFeePaid: "",
          importedFeeStatus: clean(row[5]),
          importedExtraNote: clean(row[6]),
          attendance,
        };
        parsedRows.push(parsedStudentRow);
        blockRows.push(parsedStudentRow);
      }

      dataRowIndex += 1;
    }

    const mergedBlockRows = mergeStudentRows(blockRows);
    blocks.push({
      blockId: `${sheetName}:${monthInfo.year}-${String(monthInfo.month + 1).padStart(2, "0")}`,
      sheetName,
      year: monthInfo.year,
      month: monthInfo.month + 1,
      source: monthInfo.source,
      rows: mergedBlockRows,
      estimatedAttendanceRecords: mergedBlockRows.reduce(
        (sum, item) => sum + item.attendance.length,
        0
      ),
    });
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
    blocks,
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
