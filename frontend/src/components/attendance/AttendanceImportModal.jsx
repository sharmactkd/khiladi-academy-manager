import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import {
  buildProvisionalStudentsFromAttendance,
  classifyHistoricalSheets,
  getAttendanceSheetNames,
  isHistoricalAttendanceSheet,
  isStudentRecordSheet,
  parseHistoricalAttendanceSheet,
  parseStudentRecordSheet,
  readAttendanceWorkbook,
} from "../../utils/attendanceExcelImport.js";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MAX_ATTENDANCE_WORKBOOK_SIZE_BYTES = 60 * 1024 * 1024;

const emptyPreview = {
  rows: [],
  blocks: [],
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

const uniqueByIdentity = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    const phone = String(row.phone || "").replace(/\D/g, "");
    const name = String(row.name || `${row.firstName || ""} ${row.lastName || ""}`)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const admission = String(row.admissionNumber || row.studentCode || "").trim().toLowerCase();
    const key = admission ? `admission:${admission}` : phone ? `name-phone:${name}:${phone}` : `name:${name}`;
    if (!map.has(key)) map.set(key, row);
  });
  return Array.from(map.values());
};

const SheetTypeBadge = ({ sheetName }) => {
  const type = isStudentRecordSheet(sheetName)
    ? "Student Record"
    : isHistoricalAttendanceSheet(sheetName)
      ? "Attendance"
      : "Ignored / Unsupported";
  const color = type === "Student Record" ? "#166534" : type === "Attendance" ? "#1d4ed8" : "#64748b";
  const background = type === "Student Record" ? "#dcfce7" : type === "Attendance" ? "#dbeafe" : "#f1f5f9";
  return (
    <span style={{ padding: "3px 8px", borderRadius: 999, color, background, fontSize: 12, fontWeight: 700 }}>
      {type}
    </span>
  );
};

const ResultSummary = ({ studentSummary, attendanceResults }) => {
  if (!studentSummary && !attendanceResults.length) return null;
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h3>Import Result</h3>
      {studentSummary && (
        <p className="muted">
          Students — Imported: {studentSummary.imported || 0} | Skipped: {studentSummary.skipped || 0} |
          Failed: {studentSummary.failed || 0} | Provisional detected: {studentSummary.incomplete || 0}
        </p>
      )}
      {attendanceResults.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Sheet / Month</th><th>Imported</th><th>Skipped</th><th>Failed</th></tr></thead>
            <tbody>
              {attendanceResults.map((result) => (
                <tr key={result.key}>
                  <td>{result.label}</td>
                  <td>{result.imported || 0}</td>
                  <td>{result.skipped || 0}</td>
                  <td>{result.failed || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AttendanceImportModal = ({ open, onClose, onImport, fallbackBatch, selectedBatch = null }) => {
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [classification, setClassification] = useState({ recordSheet: "", attendanceSheets: [], ignoredSheets: [] });
  const [studentSheets, setStudentSheets] = useState([]);
  const [attendanceSheets, setAttendanceSheets] = useState([]);
  const [attendanceMode, setAttendanceMode] = useState("complete");
  const [monthSheet, setMonthSheet] = useState("");
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [parsedSheets, setParsedSheets] = useState({});
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [attendanceResults, setAttendanceResults] = useState([]);

  const allSheets = useMemo(() => getAttendanceSheetNames(workbook), [workbook]);
  const selectedMonthSheetData = parsedSheets[monthSheet] || emptyPreview;
  const selectableStudentSheets = useMemo(
    () => allSheets.filter((name) => isStudentRecordSheet(name) || isHistoricalAttendanceSheet(name)),
    [allSheets]
  );
  const selectedMonthsCount = selectedBlockIds.length;
  const canStart = Boolean(
    workbook &&
    (studentSheets.length || attendanceSheets.length) &&
    (!attendanceSheets.length || fallbackBatch) &&
    (attendanceMode !== "months" || !attendanceSheets.length || selectedBlockIds.length)
  );

  if (!open) return null;

  const reset = () => {
    setFileName("");
    setWorkbook(null);
    setClassification({ recordSheet: "", attendanceSheets: [], ignoredSheets: [] });
    setStudentSheets([]);
    setAttendanceSheets([]);
    setAttendanceMode("complete");
    setMonthSheet("");
    setSelectedBlockIds([]);
    setParsedSheets({});
    setDuplicateMode("skip");
    setProgress(null);
    setStudentSummary(null);
    setAttendanceResults([]);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const parseAndCache = async (sheetName) => {
    if (!sheetName) return emptyPreview;
    if (parsedSheets[sheetName]) return parsedSheets[sheetName];
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    const parsed = parseHistoricalAttendanceSheet(workbook, sheetName);
    setParsedSheets((current) => ({ ...current, [sheetName]: parsed }));
    return parsed;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("Please select an .xlsx or .xls workbook");
      return;
    }
    if (file.size > MAX_ATTENDANCE_WORKBOOK_SIZE_BYTES) {
      toast.error("Workbook cannot exceed 60 MB");
      return;
    }

    flushSync(() => {
      reset();
      setBusy(true);
      setFileName(file.name);
    });
    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const nextWorkbook = await readAttendanceWorkbook(file);
      const names = getAttendanceSheetNames(nextWorkbook);
      if (!names.length) throw new Error("Workbook me koi worksheet nahi mili.");
      const detected = classifyHistoricalSheets(names);
      setWorkbook(nextWorkbook);
      setClassification(detected);
      setStudentSheets(detected.recordSheet ? [detected.recordSheet] : []);
      setAttendanceSheets([]);
      toast.success(`${names.length} worksheets found. Select what you want to import.`);
    } catch (error) {
      toast.error(error.message || "Workbook could not be read");
    } finally {
      setBusy(false);
    }
  };

  const toggleStudentSheet = (sheetName) => {
    setStudentSheets((current) => current.includes(sheetName)
      ? current.filter((name) => name !== sheetName)
      : [...current, sheetName]);
  };

  const toggleAttendanceSheet = async (sheetName) => {
    const removing = attendanceSheets.includes(sheetName);
    if (removing) {
      const blockIds = (parsedSheets[sheetName]?.blocks || []).map((block) => block.blockId);
      setAttendanceSheets((current) => current.filter((name) => name !== sheetName));
      setSelectedBlockIds((current) => current.filter((id) => !blockIds.includes(id)));
      if (monthSheet === sheetName) setMonthSheet("");
      return;
    }

    setBusy(true);
    try {
      const parsed = await parseAndCache(sheetName);
      setAttendanceSheets((current) => [...current, sheetName]);
      if (!monthSheet) setMonthSheet(sheetName);
      if (attendanceMode === "months") {
        setSelectedBlockIds((current) => [...new Set([
          ...current,
          ...(parsed.blocks || []).map((block) => block.blockId),
        ])]);
      }
    } catch (error) {
      toast.error(`${sheetName} could not be parsed`);
    } finally {
      setBusy(false);
    }
  };

  const selectMonthSheet = async (sheetName) => {
    setMonthSheet(sheetName);
    if (!sheetName) return;
    setBusy(true);
    try {
      await parseAndCache(sheetName);
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = (blockId) => {
    setSelectedBlockIds((current) => current.includes(blockId)
      ? current.filter((id) => id !== blockId)
      : [...current, blockId]);
  };

  const importStudents = async () => {
    if (!studentSheets.length) return null;
    setProgress({ stage: "students", label: "Preparing selected student sources..." });

    const recordRows = [];
    const attendanceSources = [];
    const warnings = [];

    for (const sheetName of studentSheets) {
      if (isStudentRecordSheet(sheetName)) {
        const parsed = parseStudentRecordSheet(workbook, sheetName);
        recordRows.push(...parsed.rows);
        warnings.push(...(parsed.warnings || []));
      } else if (isHistoricalAttendanceSheet(sheetName)) {
        attendanceSources.push(await parseAndCache(sheetName));
      }
    }

    const provisionalRows = buildProvisionalStudentsFromAttendance(attendanceSources);
    const rows = uniqueByIdentity([...recordRows, ...provisionalRows]);
    const aggregate = {
      imported: 0,
      skipped: 0,
      failed: 0,
      incomplete: rows.filter((row) => row.profileStatus === "incomplete").length,
      warnings,
      errors: [],
    };

    const batches = chunk(rows, 100);
    for (let index = 0; index < batches.length; index += 1) {
      setProgress({ stage: "students", label: `Student batch ${index + 1} of ${batches.length}` });
      const response = await studentApi.importBulk({
        students: batches[index],
        duplicateMode: "skip",
        allowProvisional: true,
      });
      const result = response?.data || {};
      aggregate.imported += result.imported || 0;
      aggregate.skipped += result.skipped || 0;
      aggregate.failed += result.failed || 0;
      aggregate.warnings.push(...(result.warnings || []));
      aggregate.errors.push(...(result.errors || []));
    }
    setStudentSummary(aggregate);
    return aggregate;
  };

  const importAttendance = async () => {
    const results = [];
    for (let sheetIndex = 0; sheetIndex < attendanceSheets.length; sheetIndex += 1) {
      const sheetName = attendanceSheets[sheetIndex];
      const parsed = await parseAndCache(sheetName);
      const allBlocks = parsed.blocks?.length ? parsed.blocks : [];
      const blocks = attendanceMode === "months"
        ? allBlocks.filter((block) => selectedBlockIds.includes(block.blockId))
        : allBlocks;

      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
        const block = blocks[blockIndex];
        if (!block.rows?.length || !block.estimatedAttendanceRecords) continue;
        const label = `${sheetName} — ${MONTHS[(block.month || 1) - 1]} ${block.year}`;
        setProgress({ stage: "attendance", label: `Importing ${label}...` });
        const result = await onImport?.({
          sheetName,
          blockId: block.blockId,
          sourceWorkbook: fileName,
          duplicateMode,
          fallbackBatch,
          strictMatching: true,
          rows: block.rows,
        });
        results.push({
          key: block.blockId,
          label,
          imported: result?.imported || 0,
          skipped: result?.skipped || 0,
          failed: result?.failed || 0,
        });
        setAttendanceResults([...results]);
      }
    }
    return results;
  };

  const handleImport = async () => {
    if (!canStart) {
      toast.error("Select at least one valid student sheet or attendance sheet/month");
      return;
    }
    setBusy(true);
    setStudentSummary(null);
    setAttendanceResults([]);
    try {
      await importStudents();
      await importAttendance();
      setProgress({ stage: "completed", label: "Selected data imported successfully" });
      toast.success("Import completed successfully", { duration: 7000 });
      window.setTimeout(() => {
        reset();
        onClose?.();
      }, 900);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Import failed";
      setProgress({ stage: "failed", label: message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const sectionStyle = { marginTop: 14, border: "1px solid #e2e8f0", borderRadius: 14 };
  const sheetGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, marginTop: 10 };
  const sheetRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 10, border: "1px solid #e2e8f0", borderRadius: 10 };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15, 23, 42, 0.68)" }}>
      <div style={{ width: "min(1100px, 96vw)", maxHeight: "92vh", overflow: "auto", borderRadius: 16, padding: 20, background: "#fff", boxShadow: "0 24px 80px rgba(15,23,42,.35)" }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2>Excel Student & Attendance Import</h2>
            <p className="muted">First choose the workbook, then independently select student and attendance sources.</p>
          </div>
          <button type="button" className="btn" onClick={close} disabled={busy}>Close</button>
        </div>

        <div className="card">
          <label>Excel Workbook<input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={busy} /></label>
          <small className="muted">Supported: .xlsx and .xls · Maximum size: 60 MB</small>
          {fileName && <p className="muted">Selected: {fileName}</p>}
        </div>

        {workbook && (
          <>
            <div className="card" style={sectionStyle}>
              <h3>All Worksheets ({allSheets.length})</h3>
              <p className="muted">The workbook contains the following sheets. Unsupported Balance/Report sheets are shown but will not be imported.</p>
              <div style={sheetGridStyle}>
                {allSheets.map((sheetName) => (
                  <div key={sheetName} style={sheetRowStyle}>
                    <strong>{sheetName}</strong><SheetTypeBadge sheetName={sheetName} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={sectionStyle}>
              <h3>1. Import Student Record</h3>
              <p className="muted">Choose one or more sheets. Attendance sheets can create provisional profiles without fake DOB.</p>
              <div style={sheetGridStyle}>
                {allSheets.map((sheetName) => {
                  const supported = selectableStudentSheets.includes(sheetName);
                  return (
                    <label key={sheetName} style={{ ...sheetRowStyle, opacity: supported ? 1 : 0.55 }}>
                      <span><input type="checkbox" checked={studentSheets.includes(sheetName)} disabled={!supported || busy} onChange={() => toggleStudentSheet(sheetName)} /> {sheetName}</span>
                      <SheetTypeBadge sheetName={sheetName} />
                    </label>
                  );
                })}
              </div>
              <p className="muted">Selected student sources: {studentSheets.join(", ") || "None"}</p>
            </div>

            <div className="card" style={sectionStyle}>
              <h3>2. Import Attendance</h3>
              <div className={`attendance-import-destination ${fallbackBatch ? "is-ready" : "is-missing"}`}>
                <strong>Import destination</strong>
                <span>{selectedBatch?.batchName || "No batch selected"}</span>
                <small>{fallbackBatch ? "Selected attendance will be imported into this batch." : "Close this dialog and select a batch before importing attendance."}</small>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 12 }}>
                <label><input type="radio" name="attendanceMode" value="complete" checked={attendanceMode === "complete"} onChange={() => setAttendanceMode("complete")} disabled={busy} /> Complete selected sheets</label>
                <label><input type="radio" name="attendanceMode" value="months" checked={attendanceMode === "months"} onChange={() => setAttendanceMode("months")} disabled={busy} /> Select months manually</label>
              </div>

              <div style={sheetGridStyle}>
                {classification.attendanceSheets.map((sheetName) => (
                  <label key={sheetName} style={sheetRowStyle}>
                    <span><input type="checkbox" checked={attendanceSheets.includes(sheetName)} disabled={busy} onChange={() => toggleAttendanceSheet(sheetName)} /> {sheetName}</span>
                    <SheetTypeBadge sheetName={sheetName} />
                  </label>
                ))}
              </div>

              {attendanceMode === "months" && attendanceSheets.length > 0 && (
                <div style={{ marginTop: 16, padding: 14, border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
                  <label>Choose attendance sheet
                    <select value={monthSheet} disabled={busy} onChange={(event) => selectMonthSheet(event.target.value)}>
                      <option value="">Select sheet</option>
                      {attendanceSheets.map((sheetName) => <option key={sheetName} value={sheetName}>{sheetName}</option>)}
                    </select>
                  </label>
                  {monthSheet && (
                    <div style={sheetGridStyle}>
                      {(selectedMonthSheetData.blocks || []).map((block) => (
                        <label key={block.blockId} style={sheetRowStyle}>
                          <span><input type="checkbox" checked={selectedBlockIds.includes(block.blockId)} onChange={() => toggleBlock(block.blockId)} disabled={busy} /> {MONTHS[(block.month || 1) - 1]} {block.year}</span>
                          <small>{block.rows?.length || 0} students · {block.estimatedAttendanceRecords || 0} cells</small>
                        </label>
                      ))}
                      {!selectedMonthSheetData.blocks?.length && <p className="muted">No month blocks detected in this sheet.</p>}
                    </div>
                  )}
                  <p className="muted">Selected months: {selectedMonthsCount}</p>
                </div>
              )}

              <div className="grid grid-2" style={{ marginTop: 14 }}>
                <label>Existing attendance
                  <select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)} disabled={busy}>
                    <option value="skip">Skip existing (Recommended)</option>
                    <option value="overwrite">Overwrite existing</option>
                  </select>
                </label>
                <div><strong>Selected attendance sheets</strong><p className="muted">{attendanceSheets.join(", ") || "None"}</p></div>
              </div>
            </div>
          </>
        )}

        {progress && <div className="card" style={{ marginTop: 14 }}><strong>{progress.label}</strong></div>}
        <ResultSummary studentSummary={studentSummary} attendanceResults={attendanceResults} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          {workbook && attendanceSheets.length > 0 && !fallbackBatch ? <p className="attendance-import-error">Select a batch before starting attendance import.</p> : null}
          <button type="button" className="btn" onClick={close} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleImport} disabled={busy || !canStart}>
            {busy ? "Processing..." : "Start Safe Import"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceImportModal;
