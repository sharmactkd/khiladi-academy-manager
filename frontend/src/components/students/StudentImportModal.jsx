import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";
import {
  getWorkbookSheetNames,
  parseStudentSheet,
  readStudentWorkbook,
  STUDENT_IMPORT_FIELDS,
} from "../../utils/studentExcelImport.js";

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.65)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    width: "min(1150px, 96vw)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
    position: "relative",
  },
  blockingLoader: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    background: "rgba(255, 255, 255, 0.82)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    cursor: "wait",
  },
  loadingText: {
    background: "#111827",
    color: "#fff",
    padding: "14px 22px",
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 700,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  smallText: {
    color: "#64748b",
    fontSize: 13,
  },
  warningBox: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    fontSize: 14,
  },
};

const StudentImportModal = ({ open, onClose, onImport }) => {
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [parsed, setParsed] = useState({
    headers: [],
    rows: [],
    mappedRows: [],
    mapping: {},
    warnings: [],
  });
  const [importing, setImporting] = useState(false);

  const mappedFields = useMemo(
    () =>
      Object.values(parsed.mapping || {}).filter(
        (value) => value !== "" && value !== null && value !== undefined
      ),
    [parsed.mapping]
  );

  if (!open) return null;

  const resetState = () => {
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setLoadingFile(false);
    setParsed({
      headers: [],
      rows: [],
      mappedRows: [],
      mapping: {},
      warnings: [],
    });
    setImporting(false);
  };

  const handleClose = () => {
    if (loadingFile || importing) return;

    resetState();
    onClose?.();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const lowerName = file.name.toLowerCase();

    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      toast.error("Please upload .xlsx, .xls or .csv file");
      return;
    }

    try {
      setLoadingFile(true);
      setFileName(file.name);
      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheet("");
      setParsed({
        headers: [],
        rows: [],
        mappedRows: [],
        mapping: {},
        warnings: [],
      });

      const nextWorkbook = await readStudentWorkbook(file);
      const names = getWorkbookSheetNames(nextWorkbook);
      const firstSheet = names[0] || "";

      setWorkbook(nextWorkbook);
      setSheetNames(names);
      setSelectedSheet(firstSheet);

      if (firstSheet) {
        setParsed(parseStudentSheet(nextWorkbook, firstSheet));
      }

      toast.success("Excel file loaded");
    } catch (error) {
      toast.error("Excel file read nahi ho payi");
      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheet("");
      setParsed({
        headers: [],
        rows: [],
        mappedRows: [],
        mapping: {},
        warnings: [error.message || "Invalid Excel file."],
      });
    } finally {
      setLoadingFile(false);
      event.target.value = "";
    }
  };

 const handleSheetChange = (event) => {
  const sheet = event.target.value;

  flushSync(() => {
    setSelectedSheet(sheet);
    setLoadingFile(true);
  });

  if (!workbook || !sheet) {
    setLoadingFile(false);
    return;
  }

  setTimeout(() => {
    try {
      setParsed(parseStudentSheet(workbook, sheet));
    } finally {
      setLoadingFile(false);
    }
  }, 100);
};

  const handleMappingChange = (field, columnIndex) => {
    const nextMapping = {
      ...parsed.mapping,
      [field]: columnIndex,
    };

    setParsed((prev) => ({
      ...prev,
      ...parseStudentSheet(workbook, selectedSheet, nextMapping),
      mapping: nextMapping,
    }));
  };

  const handleImport = async () => {
    if (!parsed.mappedRows.length) {
      toast.error("Import ke liye koi valid row nahi mili");
      return;
    }

    try {
      setImporting(true);
      await onImport?.(parsed.mappedRows);
      handleClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} role="dialog" aria-modal="true">
      <div style={modalStyles.modal}>
        {(loadingFile || importing) && (
          <div style={modalStyles.blockingLoader}>
            <div style={modalStyles.loadingText}>
              {importing ? "Importing . . ." : "Loading . . ."}
            </div>
          </div>
        )}

        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0 }}>Import Students from Excel</h2>
            <p style={{ ...modalStyles.smallText, margin: "6px 0 0" }}>
              Upload .xlsx, .xls ya .csv file. Auto mapping ke baad aap manually
              bhi column select kar sakte hain.
            </p>
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={loadingFile || importing}
          >
            Close
          </button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid grid-2">
            <div>
              <label>Excel / CSV File</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loadingFile || importing}
              />
              {fileName ? (
                <p style={modalStyles.smallText}>Selected: {fileName}</p>
              ) : null}
            </div>

            <div>
              <label>Sheet</label>
              <select
                value={selectedSheet}
                onChange={handleSheetChange}
                disabled={sheetNames.length === 0 || loadingFile || importing}
              >
                {sheetNames.length === 0 ? (
                  <option value="">No sheet selected</option>
                ) : (
                  sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {parsed.warnings?.length ? (
            <div style={modalStyles.warningBox}>
              {parsed.warnings.map((warning) => (
                <div key={warning}>⚠ {warning}</div>
              ))}
            </div>
          ) : null}
        </div>

        {parsed.headers.length ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Column Mapping</h3>

            <p style={modalStyles.smallText}>
              Agar auto mapping galat ya blank hai, to dropdown se apni Excel
              sheet ka correct column select karein.
            </p>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>App Field</th>
                    <th>Excel Column</th>
                  </tr>
                </thead>

                <tbody>
                  {STUDENT_IMPORT_FIELDS.map((field) => (
                    <tr key={field.key}>
                      <td>{field.label}</td>
                      <td>
                        <select
                          value={parsed.mapping[field.key] ?? ""}
                          onChange={(event) =>
                            handleMappingChange(field.key, event.target.value)
                          }
                          disabled={loadingFile || importing}
                        >
                          <option value="">-- Not Mapped --</option>

                          {parsed.headers.map((header, index) => (
                            <option
                              key={`${header}-${index}`}
                              value={String(index)}
                            >
                              {header || `Column ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={modalStyles.smallText}>
              Mapped fields: {mappedFields.length || 0} | Rows ready:{" "}
              {parsed.mappedRows.length || 0}
            </p>
          </div>
        ) : null}

        <div style={modalStyles.actions}>
          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={loadingFile || importing}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={loadingFile || importing || parsed.mappedRows.length === 0}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentImportModal;