import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Search, UploadCloud, X } from "lucide-react";
import { studentApi } from "../../api/studentApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import { STUDENT_IMPORT_FIELDS, buildAutoMapping, readStudentWorkbook } from "../../utils/studentExcelImport.js";
import { classifyHistoricalSheets, parseHistoricalAttendanceSheet } from "../../utils/attendanceExcelImport.js";
import { prepareMatchPreview, yieldToBrowser } from "../../utils/attendanceMatchPreview.js";
import { groupAttendanceReview, resolveAttendanceGroup } from "../../utils/attendanceReviewGroups.js";
import { chunkAttendanceResolutions } from "../../utils/attendanceImportActions.js";
import { readRecordGrid, selectableRecordRows, selectedAttendanceTasks } from "../../utils/selectiveWorkbookImport.js";
import shell from "./AttendanceImportModal.module.css";
import styles from "./SelectiveStudentImport.module.css";

const unwrap = (response) => response?.data?.data || response?.data || {};
const message = (error) => error?.response?.data?.message || error?.message || "Import failed.";
const PAGE_SIZE = 50;

export default function SelectiveStudentImport({ fallbackBatch, selectedBatch, onImport, onClose, embedded = false, initialWorkbook = null, initialSheet = "", initialFileName = "", destination = null, destinationReady = true, onRecordImport, onBusyChange }) {
  const [initial] = useState(() => initialWorkbook ? readRecordGrid(initialWorkbook, initialSheet) : { grid: [], headerIndex: 0, warning: "" });
  const [resolvedBatch, setResolvedBatch] = useState("");
  const targetBatch = resolvedBatch || fallbackBatch;
  const fileRef = useRef(null);
  const flight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("records");
  const [workbook, setWorkbook] = useState(initialWorkbook);
  const [fileName, setFileName] = useState(initialFileName);
  const [sheetName, setSheetName] = useState(initialSheet);
  const [grid, setGrid] = useState(initial.grid);
  const [headerIndex, setHeaderIndex] = useState(initial.headerIndex);
  const [mapping, setMapping] = useState(() => buildAutoMapping(initial.grid[initial.headerIndex] || []));
  const [warning, setWarning] = useState(initial.warning);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [attendanceSheets, setAttendanceSheets] = useState(() => initialWorkbook ? classifyHistoricalSheets(initialWorkbook.SheetNames).attendanceSheets.filter(name => name !== initialSheet) : []);
  const [recordResult, setRecordResult] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blockIds, setBlockIds] = useState(new Set());
  const [matches, setMatches] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [showOthers, setShowOthers] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const rows = useMemo(() => selectableRecordRows(grid, headerIndex, mapping, sheetName), [grid, headerIndex, mapping, sheetName]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(row.sourceRowKey)), [rows, selectedKeys]);
  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.phone || ""} ${row.admissionNumber || ""}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const allowedStudents = useMemo(() => [...new Map((recordResult?.importedStudents || [])
    .filter((student) => !student.batch || student.batch === String(targetBatch))
    .map((student) => [String(student.studentId), student])).values()], [recordResult, targetBatch]);
  const allowedIds = useMemo(() => new Set(allowedStudents.map((student) => String(student.studentId))), [allowedStudents]);
  const groups = useMemo(() => groupAttendanceReview(matches, resolutions), [matches, resolutions]);
  const visibleGroups = useMemo(() => groups.filter((group) => (showOthers || allowedIds.has(String(group.studentId))) &&
    `${group.name} ${group.phone || ""}`.toLowerCase().includes(search.toLowerCase())), [groups, showOthers, allowedIds, search]);
  const chosenBlocks = useMemo(() => blocks.filter((block) => blockIds.has(block.blockId)), [blocks, blockIds]);
  const tasks = useMemo(() => selectedAttendanceTasks(chosenBlocks, resolutions, allowedIds), [chosenBlocks, resolutions, allowedIds]);
  const missingAttendance = useMemo(() => {
    // Groups include all source months; this is a matching aid, not an import count.
    const matchedIds = new Set(groups.filter((group) => group.studentId).map((group) => String(group.studentId)));
    return allowedStudents.filter((student) => !matchedIds.has(String(student.studentId)));
  }, [groups, allowedStudents]);
  const totalPages = Math.max(1, Math.ceil((phase === "attendance" ? visibleGroups.length : filtered.length) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const activeRows = (phase === "attendance" ? visibleGroups : filtered).slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const configureSheet = (book, name) => {
    const parsed = readRecordGrid(book, name);
    setSheetName(name); setGrid(parsed.grid); setHeaderIndex(parsed.headerIndex);
    setMapping(buildAutoMapping(parsed.grid[parsed.headerIndex] || []));
    setWarning(parsed.warning); setSelectedKeys(new Set()); setPage(0); setSearch("");
  };
  const chooseSheet = async (name) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await yieldToBrowser(); configureSheet(workbook, name); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  };
  const load = async (file) => {
    if (!file || busy) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) { setError("Select an XLSX or XLS workbook."); return; }
    if (file.size > 60 * 1024 * 1024) { setError("Maximum workbook size is 60 MB."); return; }
    setBusy(true); setError(""); setProgress("Reading workbook…");
    try {
      await yieldToBrowser();
      const book = await readStudentWorkbook(file);
      if (!book.SheetNames.length) throw new Error("No worksheets found.");
      const detected = classifyHistoricalSheets(book.SheetNames);
      configureSheet(book, detected.recordSheet || book.SheetNames[0]);
      setWorkbook(book); setFileName(file.name); setAttendanceSheets(detected.attendanceSheets);
      setRecordResult(null); setAttendanceResult(null); setPhase("records");
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); setProgress(""); }
  };
  const toggleRecord = (key) => setSelectedKeys((current) => {
    const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const prepareAttendance = async (summary) => {
    const attendanceBatch = summary.destination?.batchId || targetBatch;
    const importedIds = new Set((summary.importedStudents || []).filter((student) => !student.batch || student.batch === String(attendanceBatch)).map((student) => String(student.studentId)));
    if (!importedIds.size) throw new Error("No confirmed students in this batch. Review the record import result first.");
    const nextBlocks = [];
    for (const name of attendanceSheets) {
      setProgress(`Reading attendance: ${name}…`); await yieldToBrowser();
      nextBlocks.push(...(parseHistoricalAttendanceSheet(workbook, name).blocks || []));
    }
    if (!nextBlocks.length) throw new Error("No supported attendance month blocks found in the selected sheets. Student records remain saved.");
    const entries = await prepareMatchPreview(nextBlocks);
    const received = new Map(); const nextResolutions = {};
    for (let offset = 0; offset < entries.length; offset += 350) {
      setProgress(`Matching attendance rows ${offset + 1}–${Math.min(entries.length, offset + 350)}…`);
      const chunk = entries.slice(offset, offset + 350);
      const preview = unwrap(await attendanceApi.previewImport({ fallbackBatch: attendanceBatch, rows: chunk.map((item) => item.row) }));
      if (preview.matches?.length !== chunk.length) throw new Error("Incomplete attendance preview. No attendance imported.");
      preview.matches.forEach((match, index) => {
        const id = String(match.student?._id || "");
        const previous = received.get(match.rowKey);
        received.set(match.rowKey, { ...match, attendanceCells: (previous?.attendanceCells || 0) + chunk[index].cells });
        nextResolutions[match.rowKey] = match.status === "matched" && importedIds.has(id) ? id : "__skip__";
      });
    }
    setBlocks(nextBlocks); setBlockIds(new Set(nextBlocks.map((block) => block.blockId)));
    setMatches([...received.values()]); setResolutions(nextResolutions);
    setSearch(""); setPage(0); setShowOthers(false); setPhase("attendance");
  };

  const importRecords = async (withAttendance) => {
    if (flight.current || busy || !selectedRows.length) return;
    const branchId = selectedBatch?.branch?._id || selectedBatch?.branch;
    if (!destinationReady || (!destination && (!fallbackBatch || !branchId))) { setError("Choose the destination branch and batch first."); return; }
    flight.current = true; setBusy(true); setError(""); setProgress("Importing selected student details…");
    try {
      const response = await (onRecordImport || studentApi.importBulk)({ students: selectedRows, allowProvisional: true,
        duplicateMode: "skip", includeImportedStudents: true, preserveMissingDates: true,
        destination: destination || { branchMode: "existing", branchId, batchMode: "existing", batchId: fallbackBatch } });
      const summary = response.data || response;
      setResolvedBatch(summary.destination?.batchId || fallbackBatch || "");
      setRecordResult(summary); setPhase("recordsDone");
      if (withAttendance) await prepareAttendance(summary);
    } catch (failure) { setError(`${message(failure)} Some student records may already be saved; check the result before retrying.`); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };
  const reviewAttendance = async () => {
    if (busy || flight.current) return;
    flight.current = true; setBusy(true); setError("");
    try { await prepareAttendance(recordResult); }
    catch (failure) { setError(message(failure)); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };
  const importAttendance = async () => {
    if (busy || flight.current || !tasks.length) return;
    flight.current = true; setBusy(true); setError("");
    const totals = { imported: 0, skipped: 0, failed: 0, metadataUpdated: 0 };
    try {
      for (let index = 0; index < tasks.length; index += 1) {
        const { block, rows: attendanceRows } = tasks[index];
        setProgress(`Importing selected attendance: ${index + 1} / ${tasks.length}…`);
        const payload = { sheetName: block.sheetName, blockId: block.blockId, sourceWorkbook: fileName,
          fallbackBatch: targetBatch, duplicateMode, rows: attendanceRows,
          resolutions: chunkAttendanceResolutions(attendanceRows, resolutions), deferRefresh: index < tasks.length - 1 };
        const summary = onImport ? await onImport(payload) : unwrap(await attendanceApi.importOldAttendance(payload));
        for (const key of Object.keys(totals)) totals[key] += Number(summary?.[key] || 0);
      }
      setAttendanceResult(totals); setPhase("done");
    } catch (failure) { setAttendanceResult(totals); setError(`${message(failure)} Earlier successful chunks remain saved. Retry with Skip existing attendance.`); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };

  return <div className={embedded ? styles.embedded : shell.backdrop} role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : true} aria-labelledby={embedded ? undefined : "selective-import-title"}><section className={embedded ? undefined : shell.modal}>
    {!embedded && <header className={shell.header}><div className={shell.headingIcon}><FileSpreadsheet /></div><div><span>SELECTIVE EXCEL IMPORT</span><h2 id="selective-import-title">Import selected players</h2><p>Full student details, with optional attendance · {selectedBatch?.batchName || "No batch selected"}</p></div><button className={shell.close} type="button" disabled={busy} onClick={onClose} aria-label="Close"><X /></button></header>}
    <div className={shell.body}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {progress && <p className={shell.progress} role="status">{progress}</p>}
      {phase === "records" && <>
        {!embedded && <>
        <button className={styles.upload} type="button" disabled={busy} onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); load(event.dataTransfer.files?.[0]); }}><UploadCloud /><strong>{fileName || "Drop Excel file here or click anywhere to browse"}</strong><small>XLSX / XLS · Maximum 60 MB · Click to change file</small></button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; load(file); }} />
        </>}
        {workbook && <>
          <div className={styles.controls}>{!embedded && <label>Student-details sheet<select disabled={busy} value={sheetName} onChange={(event) => chooseSheet(event.target.value)}>{workbook.SheetNames.map((name) => <option key={name}>{name}</option>)}</select></label>}<label>Header row<input type="number" min="1" max={Math.max(1, grid.length)} disabled={busy} value={headerIndex + 1} onChange={(event) => { const index = Math.max(0, Math.min(grid.length - 1, Number(event.target.value) - 1)); setHeaderIndex(index); setMapping(buildAutoMapping(grid[index] || [])); setSelectedKeys(new Set()); }} /></label></div>
          {warning && <p className={styles.error}>{warning}</p>}
          <details className={styles.mapping} open><summary>Column mapping — review all available student details</summary><div>{STUDENT_IMPORT_FIELDS.map((field) => <label key={field.key}>{field.label}<select disabled={busy} className={mapping[field.key] === undefined || mapping[field.key] === "" ? styles.unmapped : ""} value={mapping[field.key] ?? ""} onChange={(event) => { setMapping((current) => ({ ...current, [field.key]: event.target.value })); setSelectedKeys(new Set()); }}><option value="">Not available / ignore</option>{(grid[headerIndex] || []).map((header, index) => <option key={index} value={index}>{String(header || `Column ${index + 1}`)}</option>)}</select></label>)}</div></details>
          <p className={styles.note}>Only mapped fields are imported. Missing details remain incomplete. Existing records are skipped, not overwritten. Duplicate names are shown as separate source rows—check phone/DOB before selection.</p>
          <div className={styles.controls}><label className={styles.search}><Search size={16} /><input aria-label="Search Excel players" placeholder="Search name, phone or admission…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label><button type="button" disabled={busy} onClick={() => setSelectedKeys((current) => new Set([...current, ...filtered.map((row) => row.sourceRowKey)]))}>Select search results</button><button type="button" disabled={busy} onClick={() => setSelectedKeys(new Set())}>Clear selection</button><strong>{selectedRows.length} selected / {rows.length} players</strong></div>
          <div className={styles.tableWrap}><table><thead><tr><th>Select</th><th>Player</th><th>Phone</th><th>DOB</th><th>School</th><th>Belt</th></tr></thead><tbody>{activeRows.map((row) => <tr key={row.sourceRowKey} className={selectedKeys.has(row.sourceRowKey) ? styles.selected : ""} onClick={(event) => { if (!busy && !event.target.closest("input")) toggleRecord(row.sourceRowKey); }}><td><input type="checkbox" aria-label={`Select ${row.name}, row ${row.rowNumber}`} disabled={busy} checked={selectedKeys.has(row.sourceRowKey)} onChange={() => toggleRecord(row.sourceRowKey)} /></td><td><strong>{row.name}</strong><small>Excel row {row.rowNumber}</small></td><td>{row.phone || "—"}</td><td>{row.dateOfBirth || "—"}</td><td>{row.schoolName || "—"}</td><td>{row.beltRank || "—"}</td></tr>)}</tbody></table>{!rows.length && <p className={styles.note}>Map Name or First Name, and check the header row to display players.</p>}</div>
          <section className={styles.sheets}><strong>Attendance sheets (only used for “with attendance”)</strong><div>{workbook.SheetNames.filter((name) => name !== sheetName).map((name) => <label key={name}><input type="checkbox" disabled={busy} checked={attendanceSheets.includes(name)} onChange={() => setAttendanceSheets((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])} />{name}</label>)}</div></section>
        </>}
      </>}
      {recordResult && <section className={styles.result}><strong>Student records: {recordResult.imported} imported · {recordResult.skipped} existing/skipped · {recordResult.failed} failed</strong><p>Created records are already saved, even if you close this window. Existing profiles were not overwritten.</p>{(recordResult.errors || []).map((item, index) => <p key={index}>Row {item.rowNumber}: {item.message}</p>)}{(recordResult.warnings || []).length > 0 && <details><summary>Import warnings ({recordResult.warnings.length})</summary>{recordResult.warnings.map((item, index) => <p key={index}>Row {item.rowNumber}: {item.message}</p>)}</details>}</section>}
      {phase === "attendance" && <>
        <p className={styles.note}>Only the selected, successfully imported/existing students can receive attendance. All other workbook players are excluded by default. Review matches before importing. Uncertain matches are never imported automatically.</p>
        {missingAttendance.length > 0 && <p className={styles.error}>No linked attendance found for {missingAttendance.length} selected student(s): {missingAttendance.map((student) => student.name).join(", ")}. Use “Show other / unmatched Excel players” to check source names and link manually; otherwise no attendance is imported for them.</p>}
        <section className={styles.sheets}><strong>Attendance months</strong><div>{blocks.map((block) => <label key={block.blockId}><input type="checkbox" disabled={busy} checked={blockIds.has(block.blockId)} onChange={() => setBlockIds((current) => { const next = new Set(current); next.has(block.blockId) ? next.delete(block.blockId) : next.add(block.blockId); return next; })} />{block.sheetName} · {block.month}/{block.year}</label>)}</div></section>
        <div className={styles.controls}><input aria-label="Search attendance names" placeholder="Search workbook players…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><label><input type="checkbox" checked={showOthers} onChange={(event) => { setShowOthers(event.target.checked); setPage(0); }} />Show other / unmatched Excel players for manual linking</label><select aria-label="Existing attendance strategy" disabled={busy} value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)}><option value="skip">Skip existing attendance</option><option value="overwrite">Update existing attendance</option></select></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Excel player</th><th>Phone</th><th>Attendance cells</th><th>Selected student to link</th></tr></thead><tbody>{activeRows.map((group) => <tr key={group.groupKey}><td><strong>{group.name}</strong><small>{group.rowKeys.length} source rows</small></td><td>{group.phone || "—"}</td><td>{group.attendanceCells}</td><td><select aria-label={`Link attendance for ${group.name}`} disabled={busy} value={allowedIds.has(String(group.studentId)) ? group.studentId : "__skip__"} onChange={(event) => { const value = event.target.value; if (value === "__skip__" || allowedIds.has(value)) setResolutions((current) => resolveAttendanceGroup(current, group, value)); }}><option value="__skip__">Do not import these rows</option>{allowedStudents.map((student) => <option key={student.studentId} value={student.studentId}>{student.name} · {student.phone || student.admissionNumber}</option>)}</select></td></tr>)}</tbody></table>{!visibleGroups.length && <p className={styles.note}>No matches shown. Enable “Show other / unmatched Excel players” to review and link attendance manually.</p>}</div>
      </>}
      {attendanceResult && <section className={styles.result}><strong>Attendance: {attendanceResult.imported} imported · {attendanceResult.skipped} skipped · {attendanceResult.failed} failed</strong><p>Fee metadata updated: {attendanceResult.metadataUpdated}</p></section>}
      {(phase === "records" && workbook || phase === "attendance") && <div className={styles.controls}><button type="button" disabled={busy || !currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} / {totalPages}</span><button type="button" disabled={busy || currentPage + 1 >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
    </div>
    <footer className={shell.footer}><button type="button" className={shell.secondary} disabled={busy} onClick={onClose}>Close</button>
      {phase === "records" && <><button type="button" className={shell.secondary} disabled={busy || !selectedRows.length} onClick={() => importRecords(false)}>Import student records only ({selectedRows.length})</button><button type="button" className={shell.primary} disabled={busy || !selectedRows.length || !attendanceSheets.length} onClick={() => importRecords(true)}>Import records + review attendance</button></>}
      {phase === "recordsDone" && attendanceSheets.length > 0 && <button type="button" className={shell.primary} disabled={busy || !allowedStudents.length} onClick={reviewAttendance}>Review selected students’ attendance</button>}
      {phase === "attendance" && <button type="button" className={shell.primary} disabled={busy || !tasks.length} onClick={importAttendance}>Import selected students’ attendance</button>}
    </footer>
  </section></div>;
}
