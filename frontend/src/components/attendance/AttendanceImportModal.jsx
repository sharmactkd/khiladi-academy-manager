import { useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";
import {
  getAttendanceSheetNames,
  parseAttendanceSheet,
  readAttendanceWorkbook,
} from "../../utils/attendanceExcelImport.js";

const styles = {
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
    width: "min(900px, 96vw)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
    position: "relative",
  },
  loader: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    background: "rgba(255, 255, 255, 0.84)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    cursor: "wait",
  },
  loaderText: {
    background: "#111827",
    color: "#fff",
    padding: "14px 22px",
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 700,
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
  muted: {
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#f8fafc",
  },
};

const AttendanceImportModal = ({ open, onClose, onImport }) => {
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [duplicateMode, setDuplicateMode] = useState("overwrite");
  const [parsed, setParsed] = useState({
    rows: [],
    summary: {
      sheetName: "",
      detectedStudentRows: 0,
      detectedDateColumns: 0,
      estimatedAttendanceRecords: 0,
    },
    warnings: [],
  });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const busy = loading || importing;

  const reset = () => {
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setDuplicateMode("overwrite");
    setParsed({
      rows: [],
      summary: {
        sheetName: "",
        detectedStudentRows: 0,
        detectedDateColumns: 0,
        estimatedAttendanceRecords: 0,
      },
      warnings: [],
    });
    setLoading(false);
    setImporting(false);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const parseWithLoader = (nextWorkbook, sheet) => {
    flushSync(() => {
      setLoading(true);
    });

    setTimeout(() => {
      try {
        setParsed(parseAttendanceSheet(nextWorkbook, sheet));
      } finally {
        setLoading(false);
      }
    }, 80);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const lowerName = file.name.toLowerCase();

    if (!validExtensions.some((ext) => lowerName.endsWith(ext))) {
      toast.error("Please upload .xlsx, .xls or .csv file");
      return;
    }

    try {
      flushSync(() => {
        setLoading(true);
      });

      setFileName(file.name);
      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheet("");
      setParsed({
        rows: [],
        summary: {
          sheetName: "",
          detectedStudentRows: 0,
          detectedDateColumns: 0,
          estimatedAttendanceRecords: 0,
        },
        warnings: [],
      });

      const nextWorkbook = await readAttendanceWorkbook(file);
      const names = getAttendanceSheetNames(nextWorkbook);
      const firstSheet = names[0] || "";

      setWorkbook(nextWorkbook);
      setSheetNames(names);
      setSelectedSheet(firstSheet);

      if (firstSheet) {
        setParsed(parseAttendanceSheet(nextWorkbook, firstSheet));
      }

      toast.success("Attendance file loaded");
    } catch (error) {
      toast.error(error.message || "Attendance Excel read nahi ho payi");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleSheetChange = (event) => {
    const sheet = event.target.value;
    setSelectedSheet(sheet);

    if (!workbook || !sheet) return;

    parseWithLoader(workbook, sheet);
  };

  const handleImport = async () => {
    if (!parsed.rows.length) {
      toast.error("Import ke liye attendance rows nahi mili");
      return;
    }

    if (parsed.summary.estimatedAttendanceRecords === 0) {
      toast.error("Attendance records detect nahi hue");
      return;
    }

    try {
      setImporting(true);

      await onImport?.({
        sheetName: selectedSheet,
        duplicateMode,
        rows: parsed.rows,
      });

      handleClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true">
      <div style={styles.modal}>
        {busy && (
          <div style={styles.loader}>
            <div style={styles.loaderText}>
              {importing ? "Importing . . ." : "Loading . . ."}
            </div>
          </div>
        )}

        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0 }}>Import Old Attendance</h2>
            <p style={{ ...styles.muted, margin: "6px 0 0" }}>
              Old Excel se date-wise P/A attendance import karein.
            </p>
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid grid-2">
            <label>
              Excel / CSV File
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={busy}
              />
              {fileName ? <p style={styles.muted}>Selected: {fileName}</p> : null}
            </label>

            <label>
              Sheet
              <select
                value={selectedSheet}
                onChange={handleSheetChange}
                disabled={busy || sheetNames.length === 0}
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
            </label>
          </div>

          <label style={{ display: "block", marginTop: 12 }}>
            Duplicate Mode
            <select
              value={duplicateMode}
              onChange={(event) => setDuplicateMode(event.target.value)}
              disabled={busy}
            >
              <option value="skip">Skip existing records</option>
              <option value="overwrite">Overwrite existing records</option>
            </select>
          </label>
        </div>

        {selectedSheet ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Detected Summary</h3>

            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <strong>Sheet</strong>
                <p>{parsed.summary.sheetName || selectedSheet}</p>
              </div>

              <div style={styles.summaryCard}>
                <strong>Student Rows</strong>
                <p>{parsed.summary.detectedStudentRows || 0}</p>
              </div>

              <div style={styles.summaryCard}>
                <strong>Date Columns</strong>
                <p>{parsed.summary.detectedDateColumns || 0}</p>
              </div>

              <div style={styles.summaryCard}>
                <strong>Records Ready</strong>
                <p>{parsed.summary.estimatedAttendanceRecords || 0}</p>
              </div>
            </div>

            <p style={styles.muted}>
              Name Column: {parsed.summary.nameColumn || "-"} | Phone Column:{" "}
              {parsed.summary.phoneColumn || "-"}
            </p>

            {parsed.warnings?.length ? (
              <div style={styles.warningBox}>
                {parsed.warnings.slice(0, 30).map((warning) => (
                  <div key={warning}>⚠ {warning}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={styles.actions}>
          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={
              busy ||
              parsed.rows.length === 0 ||
              parsed.summary.estimatedAttendanceRecords === 0
            }
          >
            Import Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceImportModal;