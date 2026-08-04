import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import {
  classifyHistoricalSheets,
  getAttendanceSheetNames,
  parseHistoricalAttendanceSheet,
  parseStudentRecordSheet,
  readAttendanceWorkbook,
} from "../../utils/attendanceExcelImport.js";

const emptyPreview = {
  rows: [],
  summary: {
    sheetName: "",
    detectedStudentRows: 0,
    detectedDateColumns: 0,
    estimatedAttendanceRecords: 0,
  },
  warnings: [],
};

const chunk = (items, size) => {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const StudentImportSummary = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <strong>Student Master Result</strong>
      <p className="muted" style={{ marginBottom: 0 }}>
        Imported: {summary.imported || 0} | Skipped: {summary.skipped || 0} |
        Failed: {summary.failed || 0} | Historical-only identities: {summary.incomplete || 0}
      </p>
    </div>
  );
};

const AttendanceImportModal = ({
  open,
  onClose,
  onImport,
  fallbackBatch,
}) => {
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [classification, setClassification] = useState({
    recordSheet: "",
    attendanceSheets: [],
    ignoredSheets: [],
  });
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [previewSheet, setPreviewSheet] = useState("");
  const [preview, setPreview] = useState(emptyPreview);
  const [importRecord, setImportRecord] = useState(true);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [sheetResults, setSheetResults] = useState([]);

  const totalDetectedSheets = useMemo(
    () => getAttendanceSheetNames(workbook).length,
    [workbook]
  );

  if (!open) return null;

  const reset = () => {
    setFileName("");
    setWorkbook(null);
    setClassification({ recordSheet: "", attendanceSheets: [], ignoredSheets: [] });
    setSelectedSheets([]);
    setPreviewSheet("");
    setPreview(emptyPreview);
    setImportRecord(true);
    setDuplicateMode("skip");
    setProgress(null);
    setStudentSummary(null);
    setSheetResults([]);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const loadPreview = async (nextWorkbook, sheetName) => {
    if (!nextWorkbook || !sheetName) {
      setPreview(emptyPreview);
      return;
    }

    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    try {
      setPreview(parseHistoricalAttendanceSheet(nextWorkbook, sheetName));
    } catch (error) {
      setPreview({ ...emptyPreview, warnings: [error.message || "Sheet parse failed"] });
      toast.error(`${sheetName} read nahi ho payi`);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("Historical migration ke liye .xlsx ya .xls file upload karein");
      return;
    }

    setBusy(true);
    reset();
    setFileName(file.name);

    try {
      const nextWorkbook = await readAttendanceWorkbook(file);
      const names = getAttendanceSheetNames(nextWorkbook);
      const nextClassification = classifyHistoricalSheets(names);

      setWorkbook(nextWorkbook);
      setClassification(nextClassification);
      setSelectedSheets(nextClassification.attendanceSheets);
      setPreviewSheet(nextClassification.attendanceSheets[0] || "");
      setImportRecord(Boolean(nextClassification.recordSheet));

      if (!nextClassification.attendanceSheets.length) {
        toast.error("Attendance sheets detect nahi hui");
      } else {
        toast.success(
          `${names.length} sheets मिलीं; ${nextClassification.attendanceSheets.length} attendance sheets selected`
        );
      }
    } catch (error) {
      toast.error(error.message || "Workbook read nahi ho payi");
    } finally {
      setBusy(false);
    }
  };

  const toggleSheet = (sheetName) => {
    setSelectedSheets((current) =>
      current.includes(sheetName)
        ? current.filter((name) => name !== sheetName)
        : [...current, sheetName]
    );
  };

  const importStudentRecord = async () => {
    if (!importRecord || !classification.recordSheet) return null;

    setProgress({ stage: "students", label: "Record sheet parsing..." });
    const parsedRecord = parseStudentRecordSheet(
      workbook,
      classification.recordSheet
    );
    const aggregate = {
      imported: 0,
      skipped: 0,
      failed: 0,
      incomplete: parsedRecord.incompleteRows.length,
      errors: [],
      warnings: [...parsedRecord.warnings],
    };

    const batches = chunk(parsedRecord.rows, 100);
    for (let index = 0; index < batches.length; index += 1) {
      setProgress({
        stage: "students",
        label: `Student batch ${index + 1} of ${batches.length}`,
      });
      const response = await studentApi.importBulk(batches[index]);
      const result = response?.data || {};
      aggregate.imported += result.imported || 0;
      aggregate.skipped += result.skipped || 0;
      aggregate.failed += result.failed || 0;
      aggregate.errors.push(...(result.errors || []));
      aggregate.warnings.push(...(result.warnings || []));
    }

    setStudentSummary(aggregate);
    return aggregate;
  };

  const handleImport = async () => {
    if (!workbook || !selectedSheets.length) {
      toast.error("Kam se kam ek attendance sheet select karein");
      return;
    }
    if (!fallbackBatch) {
      toast.error("Pehle historical attendance ke liye batch select karein");
      return;
    }

    setBusy(true);
    setSheetResults([]);
    setStudentSummary(null);

    try {
      await importStudentRecord();
      const results = [];

      for (let index = 0; index < selectedSheets.length; index += 1) {
        const sheetName = selectedSheets[index];
        setProgress({
          stage: "attendance",
          label: `${sheetName} (${index + 1} of ${selectedSheets.length}) parsing...`,
        });
        await new Promise((resolve) => window.setTimeout(resolve, 20));

        const parsedSheet = parseHistoricalAttendanceSheet(workbook, sheetName);
        if (!parsedSheet.rows.length) {
          results.push({ sheetName, failed: 1, message: "No attendance rows detected" });
          setSheetResults([...results]);
          continue;
        }

        const sheetResult = {
          sheetName,
          imported: 0,
          skipped: 0,
          failed: 0,
          rawImportedStudents: 0,
          warnings: parsedSheet.warnings.length,
        };
        const blocks = parsedSheet.blocks?.length
          ? parsedSheet.blocks
          : [
              {
                blockId: sheetName,
                rows: parsedSheet.rows,
                estimatedAttendanceRecords:
                  parsedSheet.summary?.estimatedAttendanceRecords || 0,
              },
            ];

        for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
          const block = blocks[blockIndex];
          if (!block.rows.length || !block.estimatedAttendanceRecords) continue;
          setProgress({
            stage: "attendance",
            label: `${sheetName}: month ${blockIndex + 1} of ${blocks.length} save हो रहा है...`,
          });
          const result = await onImport?.({
            sheetName,
            blockId: block.blockId,
            sourceWorkbook: fileName,
            duplicateMode,
            fallbackBatch,
            strictMatching: true,
            rows: block.rows,
          });
          sheetResult.imported += result?.imported || 0;
          sheetResult.skipped += result?.skipped || 0;
          sheetResult.failed += result?.failed || 0;
          sheetResult.rawImportedStudents += result?.rawImportedStudents || 0;
        }

        results.push(sheetResult);
        setSheetResults([...results]);
      }

      setProgress({ stage: "completed", label: "Historical migration completed" });
      toast.success(
        "Historical migration completed successfully. Attendance data import ho gaya.",
        { duration: 7000 }
      );
      reset();
      onClose?.();
    } catch (error) {
      setProgress({
        stage: "failed",
        label: error.response?.data?.message || error.message || "Migration failed",
      });
      toast.error(error.response?.data?.message || "Historical migration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15, 23, 42, 0.68)",
      }}
    >
      <div
        style={{
          width: "min(1050px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          borderRadius: 16,
          padding: 20,
          background: "#ffffff",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
        }}
      >
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2>Historical Student & Attendance Migration</h2>
            <p className="muted">
              Record और सभी yearly attendance sheets import होंगी। Balance/report sheets ignore रहेंगी।
            </p>
          </div>
          <button type="button" className="btn" onClick={close} disabled={busy}>Close</button>
        </div>

        <div className="card">
          <label>
            Historical Excel Workbook
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={busy} />
          </label>
          {fileName && <p className="muted">Selected: {fileName}</p>}
        </div>

        {workbook && (
          <>
            <div className="card" style={{ marginTop: 14 }}>
              <h3>Workbook Classification</h3>
              <p>Total sheets: {totalDetectedSheets}</p>
              <label style={{ display: "block", marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={importRecord && Boolean(classification.recordSheet)}
                  disabled={!classification.recordSheet || busy}
                  onChange={(event) => setImportRecord(event.target.checked)}
                />{" "}
                Import Student Master: {classification.recordSheet || "Not detected"}
              </label>

              <strong>Attendance sheets</strong>
              <div className="grid grid-3" style={{ marginTop: 8 }}>
                {classification.attendanceSheets.map((sheetName) => (
                  <label key={sheetName}>
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(sheetName)}
                      onChange={() => toggleSheet(sheetName)}
                      disabled={busy}
                    />{" "}
                    {sheetName}
                  </label>
                ))}
              </div>
              <p className="muted">
                Ignored automatically: {classification.ignoredSheets.join(", ") || "None"}
              </p>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="grid grid-2">
                <label>
                  Preview attendance sheet
                  <select
                    value={previewSheet}
                    disabled={busy}
                    onChange={(event) => {
                      const sheet = event.target.value;
                      setPreviewSheet(sheet);
                      loadPreview(workbook, sheet);
                    }}
                  >
                    <option value="">Select sheet</option>
                    {classification.attendanceSheets.map((sheet) => (
                      <option key={sheet} value={sheet}>{sheet}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Existing attendance
                  <select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)} disabled={busy}>
                    <option value="skip">Skip existing (Recommended)</option>
                    <option value="overwrite">Overwrite existing</option>
                  </select>
                </label>
              </div>
              {preview.summary.sheetName && (
                <p className="muted">
                  {preview.summary.sheetName}: {preview.summary.detectedStudentRows || 0} students, {preview.summary.detectedDateColumns || 0} date columns, {preview.summary.estimatedAttendanceRecords || 0} records
                </p>
              )}
            </div>
          </>
        )}

        {progress && (
          <div className="card" style={{ marginTop: 14 }}>
            <strong>{progress.label}</strong>
          </div>
        )}

        <StudentImportSummary summary={studentSummary} />

        {sheetResults.length > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <h3>Attendance Results</h3>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Sheet</th><th>Imported</th><th>Skipped</th><th>Failed</th><th>Historical identities</th></tr></thead>
                <tbody>
                  {sheetResults.map((result) => (
                    <tr key={result.sheetName}>
                      <td>{result.sheetName}</td>
                      <td>{result.imported || 0}</td>
                      <td>{result.skipped || 0}</td>
                      <td>{result.failed || 0}</td>
                      <td>{result.rawImportedStudents || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" className="btn" onClick={close} disabled={busy}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={busy || !workbook || !selectedSheets.length || !fallbackBatch}
          >
            {busy ? "Processing..." : "Start Safe Migration"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceImportModal;
