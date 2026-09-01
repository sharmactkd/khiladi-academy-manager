import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, ChevronRight, FileSpreadsheet, Link2, SearchCheck, UploadCloud, UsersRound, X } from "lucide-react";

import { attendanceApi } from "../../api/attendanceApi.js";
import { classifyHistoricalSheets, getAttendanceSheetNames, parseHistoricalAttendanceSheet, readAttendanceWorkbook } from "../../utils/attendanceExcelImport.js";
import styles from "./AttendanceImportModal.module.css";
import AttendanceMatchSections from "./AttendanceMatchSections.jsx";
import { studentApi } from "../../api/studentApi.js";
import { buildAttendanceImportResolutions, chunkAttendanceResolutions, provisionalStudentValues } from "../../utils/attendanceImportActions.js";
import { buildAttendanceUnmatchedHistory, groupAttendanceReview, resolveAttendanceGroup } from "../../utils/attendanceReviewGroups.js";
import { prepareMatchPreview, yieldToBrowser } from "../../utils/attendanceMatchPreview.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MAX_WORKBOOK_SIZE_BYTES = 60 * 1024 * 1024;
const emptyPreview = { rows: [], blocks: [], summary: {}, warnings: [] };
const unwrap = (response) => response?.data?.data || response?.data || {};
const splitRowsForTransport = (rows = [], maxRows = 350, maxBytes = 1200 * 1024) => {
  const chunks = []; let current = []; let bytes = 0;
  rows.forEach((row) => {
    const rowBytes = new Blob([JSON.stringify(row)]).size;
    if (current.length && (current.length >= maxRows || bytes + rowBytes > maxBytes)) {
      chunks.push(current); current = []; bytes = 0;
    }
    current.push(row); bytes += rowBytes;
  });
  if (current.length) chunks.push(current);
  return chunks;
};

const AttendanceImportModal = ({ open, onClose, onImport, fallbackBatch, selectedBatch = null }) => {
  const fileInputRef = useRef(null);
  const bulkCreatingRef = useRef(false);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [classification, setClassification] = useState({ attendanceSheets: [] });
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [parsedSheets, setParsedSheets] = useState({});
  const [selectMonths, setSelectMonths] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [matches, setMatches] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [result, setResult] = useState(null);
  const reviewGroups = useMemo(() => groupAttendanceReview(matches, resolutions), [matches, resolutions]);
  const historyGroups = useMemo(() => buildAttendanceUnmatchedHistory(matches, resolutions), [matches, resolutions]);

  const sheetNames = useMemo(() => getAttendanceSheetNames(workbook), [workbook]);
  const selectedBlocks = useMemo(() => selectedSheets.flatMap((sheetName) => {
    const blocks = (parsedSheets[sheetName] || emptyPreview).blocks || [];
    return selectMonths ? blocks.filter((block) => selectedBlockIds.includes(block.blockId)) : blocks;
  }), [parsedSheets, selectMonths, selectedBlockIds, selectedSheets]);
  const unresolvedCount = reviewGroups.filter((group) => !group.studentId && !group.excluded).length;
  const resolvedCount = reviewGroups.filter((group) => group.studentId).length;

  if (!open) return null;

  const reset = () => {
    setStep(1); setFileName(""); setFileSize(0); setWorkbook(null);
    setClassification({ attendanceSheets: [] }); setSelectedSheets([]); setParsedSheets({});
    setSelectMonths(false); setSelectedBlockIds([]); setDuplicateMode("skip");
    setBusy(false); setProgress(""); setMatches([]); setAvailableStudents([]);
    setResolutions({}); setResult(null);
  };

  const close = () => { if (!busy) { reset(); onClose?.(); } };

  const loadFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) return toast.error("Please select an .xlsx or .xls workbook");
    if (file.size > MAX_WORKBOOK_SIZE_BYTES) return toast.error("Workbook cannot exceed 60 MB");
    flushSync(() => { reset(); setBusy(true); setFileName(file.name); setFileSize(file.size); setProgress("Reading workbook safely…"); });
    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const nextWorkbook = await readAttendanceWorkbook(file);
      const detected = classifyHistoricalSheets(getAttendanceSheetNames(nextWorkbook));
      if (!detected.attendanceSheets.length) throw new Error("No supported attendance worksheet was detected");
      const cache = {};
      detected.attendanceSheets.forEach((sheetName) => { cache[sheetName] = parseHistoricalAttendanceSheet(nextWorkbook, sheetName); });
      setWorkbook(nextWorkbook); setClassification(detected); setParsedSheets(cache);
      setSelectedSheets(detected.attendanceSheets);
      setSelectedBlockIds(detected.attendanceSheets.flatMap((name) => (cache[name]?.blocks || []).map((block) => block.blockId)));
      setStep(2); setProgress("");
      toast.success(`${detected.attendanceSheets.length} attendance sheet(s) detected`);
    } catch (error) { setProgress(""); toast.error(error.message || "Workbook could not be read"); }
    finally { setBusy(false); }
  };

  const handleFileChange = (event) => { const file = event.target.files?.[0]; event.target.value = ""; loadFile(file); };
  const handleDrop = (event) => { event.preventDefault(); if (!busy) loadFile(event.dataTransfer.files?.[0]); };
  const toggleSheet = (sheetName) => setSelectedSheets((current) => current.includes(sheetName) ? current.filter((name) => name !== sheetName) : [...current, sheetName]);
  const toggleBlock = (blockId) => setSelectedBlockIds((current) => current.includes(blockId) ? current.filter((id) => id !== blockId) : [...current, blockId]);

  const analyzeMatches = async () => {
    if (!fallbackBatch) return toast.error("Select a destination batch first");
    if (!selectedBlocks.length) return toast.error("Select at least one attendance month");
    setBusy(true); setProgress("Matching workbook students with Student Records…");
    setMatches([]); setAvailableStudents([]); setResolutions({});
    try {
      const matchMap = new Map(); const studentMap = new Map();
      await yieldToBrowser();
      const entries = await prepareMatchPreview(selectedBlocks, (count) => setProgress(`Preparing identities: ${count} rows…`));
      if (!entries.length) throw new Error("No student rows found in the selected attendance months.");
      const previewChunks = [];
      for (let offset = 0; offset < entries.length; offset += 350) previewChunks.push(entries.slice(offset, offset + 350));
      for (let index = 0; index < previewChunks.length; index += 1) {
        setProgress(`Matching student group ${index + 1} of ${previewChunks.length}…`);
        const data = unwrap(await attendanceApi.previewImport({ fallbackBatch, rows: previewChunks[index].map((entry) => entry.row) }));
        if (!Array.isArray(data.matches) || data.matches.length !== previewChunks[index].length) throw new Error("Incomplete matching response. Please retry review.");
        (data.availableStudents || []).forEach((student) => studentMap.set(student._id, student));
        data.matches.forEach((received, rowIndex) => {
          const match = { ...received, attendanceCells: previewChunks[index][rowIndex].cells };
          const current = matchMap.get(match.rowKey);
          matchMap.set(match.rowKey, current ? { ...current, attendanceCells: Number(current.attendanceCells || 0) + Number(match.attendanceCells || 0) } : match);
        });
      }
      setMatches(Array.from(matchMap.values())); setAvailableStudents(Array.from(studentMap.values()));
      setStep(3); setProgress("");
    } catch (error) { toast.error(error.response?.data?.message || error.message || "Matching failed"); setProgress(""); }
    finally { setBusy(false); }
  };

  const setResolution = (group, studentId) => setResolutions((current) => resolveAttendanceGroup(current, group, studentId));

  const createAttendanceStudent = async (group, values, manageBusy = true) => {
    if (!fallbackBatch) throw new Error("Select a destination batch first");
    if (manageBusy) setBusy(true);
    try {
      const branch = selectedBatch?.branch?._id || selectedBatch?.branch;
      const response = await studentApi.create({
        firstName: values.firstName.trim(), lastName: values.lastName.trim(),
        batch: fallbackBatch, ...(branch ? { branch } : {}),
        status: values.status,
        importSource: "excel-attendance",
      });
      const student = response?.data?.student || response?.data || response?.student;
      if (!student?._id) throw new Error("Student may have been created, but confirmation was not received. Check Student Records before trying again.");
      const candidate = {
        ...student,
        name: [student.firstName, student.lastName].filter(Boolean).join(" "),
        batch: student.batch?._id || student.batch,
      };
      setAvailableStudents((current) => [...current.filter((item) => item._id !== candidate._id), candidate]);
      setResolution(group, candidate._id);
      if (manageBusy) toast.success("Student record created and linked. Attendance will save when you click Import.");
    } finally { if (manageBusy) setBusy(false); }
  };

  const createAllUnmatched = async () => {
    if (bulkCreatingRef.current || busy) return null;
    const pending = reviewGroups.filter((group) => !group.studentId && !group.excluded);
    bulkCreatingRef.current = true;
    setBusy(true);
    let created = 0;
    let error = "";
    try {
      for (const group of pending) {
        setProgress(`Creating student records: ${created + 1} / ${pending.length}…`);
        await createAttendanceStudent(group, provisionalStudentValues(group), false);
        created += 1;
      }
    } catch (failure) {
      error = failure.response?.data?.message || failure.message || "Creation could not be confirmed.";
    } finally {
      bulkCreatingRef.current = false; setBusy(false); setProgress("");
    }
    return { created, remaining: pending.length - created, error };
  };

  const startImport = async (matchedOnly = false) => {
    if (!resolvedCount) return toast.error("Confirm at least one student first.");
    if (!matchedOnly && unresolvedCount) return toast.error(`Resolve or exclude ${unresolvedCount} student group(s), or choose Import matched only.`);
    const importResolutions = buildAttendanceImportResolutions(reviewGroups, matchedOnly);
    setBusy(true);
    const totals = { imported: 0, skipped: 0, failed: 0, cells: 0, months: 0 };
    try {
      const importTasks = selectedBlocks.flatMap((block) =>
        splitRowsForTransport(block.rows || []).map((rows) => ({ block, rows }))
      );
      for (let index = 0; index < importTasks.length; index += 1) {
        const { block, rows } = importTasks[index];
        setProgress(`Importing ${MONTHS[(block.month || 1) - 1]} ${block.year} (${index + 1}/${importTasks.length})…`);
        const summary = await onImport?.({ sheetName: block.sheetName, blockId: block.blockId, sourceWorkbook: fileName, duplicateMode, fallbackBatch, resolutions: chunkAttendanceResolutions(rows, importResolutions), deferRefresh: index < importTasks.length - 1, rows });
        totals.imported += Number(summary?.imported || 0); totals.skipped += Number(summary?.skipped || 0);
        totals.failed += Number(summary?.failed || 0); totals.cells += Number(summary?.totalAttendanceCells || 0);
      }
      totals.months = selectedBlocks.length;
      totals.unmatchedDeferred = matchedOnly ? unresolvedCount : 0;
      setResult(totals); setStep(4); setProgress("");
      if (totals.failed) toast.error("Import finished with failures. Review the result.");
      else toast.success("Attendance import completed successfully");
    } catch (error) { toast.error(error.response?.data?.message || error.message || "Import failed"); setProgress(""); }
    finally { setBusy(false); }
  };

  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="attendance-import-title">
    <section className={styles.modal}>
      <header className={styles.header}><div className={styles.headingIcon}><FileSpreadsheet /></div><div><span>ATTENDANCE DATA</span><h2 id="attendance-import-title">Import Attendance from Excel</h2><p>Attendance only—existing Student Records are matched before import.</p></div><button type="button" className={styles.close} onClick={close} disabled={busy} aria-label="Close"><X /></button></header>
      <nav className={styles.steps} aria-label="Import progress">{["Workbook", "Months", "Student matching", "Result"].map((label, index) => { const number = index + 1; return <div key={label} className={step >= number ? styles.stepActive : ""}><b>{step > number ? "✓" : number}</b><span>{label}</span></div>; })}</nav>
      <div className={styles.body}>
        {step === 1 && <button type="button" className={styles.dropzone} onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} disabled={busy}><UploadCloud /><strong>Drop Excel attendance file here or browse</strong><span>.xlsx, .xls · Maximum 60 MB</span></button>}
        <input ref={fileInputRef} className={styles.hiddenInput} type="file" accept=".xlsx,.xls" onChange={handleFileChange} />

        {step === 2 && <>
          <div className={styles.fileBar}><FileSpreadsheet /><div><strong>{fileName}</strong><span>{(fileSize / 1024 / 1024).toFixed(2)} MB · {sheetNames.length} worksheets</span></div><button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>Change file</button></div>
          <div className={`${styles.destination} ${fallbackBatch ? styles.ready : styles.missing}`}><UsersRound /><div><strong>Attendance destination</strong><span>{selectedBatch?.batchName || "No batch selected"}</span><small>Only students from this batch (or without an assigned batch) can be matched.</small></div></div>
          <section className={styles.panel}><div className={styles.panelHeading}><div><b>01</b><span><strong>Attendance worksheets</strong><small>Student Record sheets are intentionally not imported here.</small></span></div></div><div className={styles.sheetGrid}>{(classification.attendanceSheets || []).map((sheetName) => <button type="button" key={sheetName} className={selectedSheets.includes(sheetName) ? styles.selectedTile : styles.tile} onClick={() => toggleSheet(sheetName)} disabled={busy}><FileSpreadsheet /><span><strong>{sheetName}</strong><small>{parsedSheets[sheetName]?.blocks?.length || 0} month blocks</small></span><b>{selectedSheets.includes(sheetName) ? "✓" : "+"}</b></button>)}</div></section>
          <section className={styles.panel}><div className={styles.panelHeading}><div><b>02</b><span><strong>Select period</strong><small>Import complete sheets or selected month blocks.</small></span></div><label><input type="checkbox" checked={selectMonths} onChange={(event) => setSelectMonths(event.target.checked)} /> Select months manually</label></div>{selectMonths ? <div className={styles.monthGrid}>{selectedSheets.flatMap((sheetName) => (parsedSheets[sheetName]?.blocks || []).map((block) => <label key={block.blockId} className={selectedBlockIds.includes(block.blockId) ? styles.monthSelected : styles.monthTile}><input type="checkbox" checked={selectedBlockIds.includes(block.blockId)} onChange={() => toggleBlock(block.blockId)} /><span><strong>{MONTHS[(block.month || 1) - 1]} {block.year}</strong><small>{block.rows?.length || 0} students · {block.estimatedAttendanceRecords || 0} cells</small></span></label>))}</div> : <p className={styles.selectionNote}>{selectedBlocks.length} month blocks selected from {selectedSheets.length} worksheets.</p>}</section>
          <section className={styles.panel}><div className={styles.panelHeading}><div><b>03</b><span><strong>Existing attendance</strong><small>Choose how already-saved student/date cells should be handled.</small></span></div></div><div className={styles.strategy}><label className={duplicateMode === "skip" ? styles.strategyActive : ""}><input type="radio" name="duplicate" checked={duplicateMode === "skip"} onChange={() => setDuplicateMode("skip")} /><span><strong>Skip existing</strong><small>Recommended · keeps current attendance unchanged.</small></span></label><label className={duplicateMode === "overwrite" ? styles.strategyActive : ""}><input type="radio" name="duplicate" checked={duplicateMode === "overwrite"} onChange={() => setDuplicateMode("overwrite")} /><span><strong>Update existing</strong><small>Workbook status replaces existing student/date status.</small></span></label></div></section>
        </>}

        {step === 3 && <>
          <div className={styles.summaryGrid}><article><CheckCircle2 /><span><small>Ready</small><strong>{resolvedCount}</strong></span></article><article><AlertTriangle /><span><small>Needs review</small><strong>{unresolvedCount}</strong></span></article><article><UsersRound /><span><small>Student groups</small><strong>{reviewGroups.length}</strong></span></article><article><Link2 /><span><small>Attendance cells</small><strong>{matches.reduce((sum, item) => sum + Number(item.attendanceCells || 0), 0)}</strong></span></article></div>
          <div className={styles.reviewNotice}><SearchCheck /><div><strong>Safe student matching</strong><span>Phone, admission/code, exact name + selected batch, then unique exact name. No fuzzy match is imported automatically.</span></div></div>
          <AttendanceMatchSections groups={reviewGroups} historyGroups={historyGroups} availableStudents={availableStudents} onResolve={setResolution} onCreate={createAttendanceStudent} onCreateAll={createAllUnmatched} busy={busy} />
        </>}

        {step === 4 && result && <div className={styles.complete}><CheckCircle2 /><span>IMPORT COMPLETE</span><h3>{result.failed ? "Import finished with failures" : "Attendance import completed"}</h3><p>All imported attendance is linked to confirmed Student Records.</p>{result.unmatchedDeferred > 0 && <p>{result.unmatchedDeferred} unmatched groups were left unimported. Use Back to review and import them later.</p>}<div><article><small>Months</small><strong>{result.months}</strong></article><article><small>Imported</small><strong>{result.imported}</strong></article><article><small>Skipped</small><strong>{result.skipped}</strong></article><article><small>Failed</small><strong>{result.failed}</strong></article></div></div>}
        {progress && <div className={styles.progress}><span /><strong>{progress}</strong></div>}
      </div>
      <footer className={styles.footer}><button type="button" className={styles.secondary} onClick={step === 4 ? close : step > 1 ? () => setStep(step - 1) : close} disabled={busy}>{step === 4 ? "Close" : step > 1 ? "Back" : "Cancel"}</button>{step === 2 && <button type="button" className={styles.primary} onClick={analyzeMatches} disabled={busy || !fallbackBatch || !selectedBlocks.length}>Review student matches <ChevronRight /></button>}{step === 3 && <button type="button" className={styles.primary} onClick={() => startImport(false)} disabled={busy || unresolvedCount > 0 || !resolvedCount}>Import verified attendance <ChevronRight /></button>}{step === 3 && <button type="button" className={styles.primary} onClick={() => startImport(true)} disabled={busy || !resolvedCount}>Import matched only ({resolvedCount}) <ChevronRight /></button>}{step === 4 && <button type="button" className={styles.secondary} onClick={() => setStep(3)} disabled={busy}>Back to student matching</button>}</footer>
    </section>
  </div>;
};

export default AttendanceImportModal;
