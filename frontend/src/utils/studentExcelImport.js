import * as XLSX from "xlsx";

const FIELD_ALIASES = {
  studentCode: ["student code", "studentcode", "code", "id", "student id"],
  admissionNumber: [
    "admission number",
    "admission no",
    "adm no",
    "admission",
    "registration no",
    "reg no",
  ],
  name: ["name", "student name", "full name", "player name"],
  firstName: ["first name", "firstname"],
  lastName: ["last name", "lastname", "surname"],
  gender: ["gender", "sex"],
  dateOfBirth: ["dob", "date of birth", "birth date"],
  phone: ["phone", "mobile", "mobile number", "contact", "contact number"],
  email: ["email", "email id"],
  schoolName: ["school", "school name", "school/college", "college"],
  parentName: ["parent name", "father name", "mother name", "guardian name"],
  parentPhone: [
    "parent phone",
    "guardian phone",
    "father phone",
    "mother phone",
  ],
  batchName: ["batch", "batch name", "class", "class name"],
  martialArt: ["martial art", "martial arts", "sport", "discipline"],
  beltRank: ["belt", "belt rank", "rank", "grade"],
  joiningDate: ["joining date", "admission date", "join date"],
  city: ["city", "district"],
  state: ["state"],
  address: ["address", "full address"],
  notes: ["medical notes", "notes", "remarks"],
  emergencyContactName: ["emergency contact name", "emergency name"],
  emergencyContactPhone: ["emergency contact phone", "emergency phone"],
  status: ["status"],
};

export const STUDENT_IMPORT_FIELDS = [
  { key: "studentCode", label: "Student Code" },
  { key: "admissionNumber", label: "Admission Number" },
  { key: "name", label: "Name" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "gender", label: "Gender" },
  { key: "dateOfBirth", label: "DOB" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "schoolName", label: "School Name" },
  { key: "parentName", label: "Parent Name" },
  { key: "parentPhone", label: "Parent Phone" },
  { key: "batchName", label: "Batch" },
  { key: "martialArt", label: "Martial Art" },
  { key: "beltRank", label: "Belt Rank" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "address", label: "Address" },
  { key: "notes", label: "Medical Notes" },
  { key: "emergencyContactName", label: "Emergency Contact Name" },
  { key: "emergencyContactPhone", label: "Emergency Contact Phone" },
  { key: "status", label: "Status" },
];

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const aliasLookup = Object.entries(FIELD_ALIASES).reduce((acc, [field, aliases]) => {
  aliases.forEach((alias) => {
    acc[normalizeKey(alias)] = field;
  });
  return acc;
}, {});

const cleanCell = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const readStudentWorkbook = async (file) => {
  const buffer = await file.arrayBuffer();

  const metadata = XLSX.read(buffer, {
    type: "array",
    bookSheets: true,
    bookProps: true,
  });

  return { SheetNames: metadata.SheetNames || [], __buffer: buffer, __lazy: true };
};

export const getWorkbookSheetNames = (workbook) => workbook?.SheetNames || [];

export const buildAutoMapping = (headers = []) => {
  const mapping = {};

  headers.forEach((header, index) => {
    const field = aliasLookup[normalizeKey(header)];

    if (field && mapping[field] === undefined) {
      mapping[field] = String(index);
    }
  });

  return mapping;
};

export const buildMappedRows = (dataRows = [], mapping = {}) => {
  return dataRows
    .map((row, index) => {
      const student = {
        rowNumber: index + 2,
      };

      Object.entries(mapping).forEach(([field, columnIndex]) => {
        if (columnIndex === "" || columnIndex === null || columnIndex === undefined) {
          return;
        }

        student[field] = cleanCell(row[Number(columnIndex)]);
      });

      if (!student.name) {
        student.name = [student.firstName, student.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      return student;
    })
    .filter((student) =>
      Object.entries(student).some(
        ([key, value]) => key !== "rowNumber" && cleanCell(value)
      )
    );
};

export const parseStudentSheet = (workbook, sheetName, customMapping = null) => {
  const loadedWorkbook = workbook?.__lazy
    ? XLSX.read(workbook.__buffer, {
        type: "array",
        cellDates: true,
        raw: false,
        sheets: [sheetName],
      })
    : workbook;
  const worksheet = loadedWorkbook?.Sheets?.[sheetName];

  if (!worksheet) {
    return {
      headers: [],
      rows: [],
      mappedRows: [],
      mapping: {},
      warnings: ["Selected sheet not found."],
    };
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const nonEmptyRows = rawRows.filter((row) =>
    row.some((cell) => cleanCell(cell))
  );

  if (nonEmptyRows.length === 0) {
    return {
      headers: [],
      rows: [],
      mappedRows: [],
      mapping: {},
      warnings: ["Selected sheet is empty."],
    };
  }

  const headers = nonEmptyRows[0].map(cleanCell);
  const dataRows = nonEmptyRows.slice(1);
  const mapping = customMapping || buildAutoMapping(headers);
  const mappedRows = buildMappedRows(dataRows, mapping);

  const warnings = [];

  if (Object.keys(mapping).filter((key) => mapping[key] !== "").length === 0) {
    warnings.push("No matching student columns were auto-mapped.");
  }

  return {
    headers,
    rows: dataRows,
    mappedRows,
    mapping,
    warnings,
  };
};
