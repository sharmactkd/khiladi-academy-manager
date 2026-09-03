import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UploadCloud, FileSpreadsheet, History, Search, RefreshCw } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import api from "../../api/api.js";
import { getDefaultStudentSheet, buildAutoMapping, STUDENT_IMPORT_FIELDS } from "../../utils/studentExcelImport.js";
import { selectableRecordRows } from "../../utils/selectiveWorkbookImport.js";
import { isHistoricalAttendanceSheet } from "../../utils/attendanceExcelImport.js";
import { directory, suggest, chunks, attendancePayloads, id, list, norm, studentName, unwrap, safeCsv, journalSummary } from "./importLogic.js";
import { draftStore } from "./draftStore.js";
import styles from "./Imports.module.css";

const errorText = error => error?.response?.data?.message || error.message || "Operation failed";
const emptyResult = () => ({ created: 0, updated: 0, unchanged: 0, attendance: 0, skipped: 0, failed: 0, metadata: 0, errors: [] });
const pageSize = 50;
const reviewFields = ["aadhaarNumber", "dateOfBirth", "phone", "email", "schoolName", "className", "section", "collegeName", "occupation", "parentName", "parentPhone", "address", "city", "state", "beltRank", "danRank", "heightCm", "weightKg", "bloodGroup", "medicalConditions", "joiningDate", "notes"];

export default function Imports() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("type") === "attendance" ? "attendance" : "students");
  const [file, setFile] = useState(null), [hash, setHash] = useState("");
  const [sheetRoles, setSheetRoles] = useState({}), [records, setRecords] = useState({}), [blocks, setBlocks] = useState([]);
  const [months, setMonths] = useState([]), [branches, setBranches] = useState([]), [batches, setBatches] = useState([]), [students, setStudents] = useState([]);
  const [branch, setBranch] = useState(""), [batch, setBatch] = useState(params.get("batch") || "");
  const [phase, setPhase] = useState("setup"), [busy, setBusy] = useState(false), [progress, setProgress] = useState(""), [error, setError] = useState("");
  const [scope, setScope] = useState("selected"), [selected, setSelected] = useState([]), [decisions, setDecisions] = useState({});
  const [query, setQuery] = useState(""), [existingQuery, setExistingQuery] = useState(""), [tab, setTab] = useState("all"), [page, setPage] = useState(0);
  const [policy, setPolicy] = useState("fill-empty"), [duplicateMode, setDuplicateMode] = useState("skip");
  const [sessions, setSessions] = useState([]), [job, setJob] = useState(null), [result, setResult] = useState(null), [resumePlan, setResumePlan] = useState(null);
  const [warnings, setWarnings] = useState([]), [draftExists, setDraftExists] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [mappingProfiles, setMappingProfiles] = useState({});
  const [overrides, setOverrides] = useState({});
  const worker = useRef(null), pending = useRef(new Map()), sequence = useRef(0), flight = useRef(false), stop = useRef(false), fileInput = useRef(null), loadedHash = useRef("");
  const draftKey = `operator:${id(user)}:${id(user?.academy)}`;
  useEffect(() => { draftStore(`mappings:${draftKey}`).then(value => setMappingProfiles(value || {})).catch(() => {}); }, [draftKey]);

  const refresh = async () => {
    const [a, b, c, d] = await Promise.all([api.get("/branches"), api.get("/batches"), api.get("/students"), api.get("/import-sessions")]);
    setBranches(list(a, "branches")); setBatches(list(b, "batches")); setStudents(list(c, "students")); setSessions(list(d, "sessions"));
  };
  useEffect(() => { refresh().catch(e => setError(errorText(e))); draftStore(draftKey).then(value => setDraftExists(Boolean(value))).catch(() => {}); return () => { worker.current?.terminate(); }; }, [draftKey]);
  useEffect(() => { if (!branch && branches.length === 1) setBranch(id(branches[0])); }, [branches, branch]);
  const batchOptions = batches.filter(item => !branch || id(item.branch) === branch);
  useEffect(() => { if (!batch && batchOptions.length === 1) setBatch(id(batchOptions[0])); }, [batchOptions, batch]);
  useEffect(() => { const current = batches.find(item => id(item) === batch); if (current && !branch) setBranch(id(current.branch)); }, [batches, batch, branch]);
  useEffect(() => { const guard = e => { if (busy) { e.preventDefault(); e.returnValue = ""; } }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [busy]);

  const request = (type, extra = {}) => new Promise((resolve, reject) => {
    const requestId = ++sequence.current; pending.current.set(requestId, { resolve, reject });
    worker.current.postMessage({ requestId, type, ...extra });
  });
  const cancelAnalysis = () => {
    worker.current?.terminate(); worker.current = null; loadedHash.current = "";
    for (const task of pending.current.values()) task.reject(new Error("Analysis cancelled. Choose the file again to continue."));
    pending.current.clear();
  };
  const openFile = async (source, restore = null) => {
    if (!source || flight.current) return;
    if (!/\.(xlsx|xls|csv)$/i.test(source.name) || source.size > 60 * 1024 * 1024) { setError("Choose XLSX, XLS or CSV, maximum 60 MB."); return; }
    flight.current = true; setBusy(true); setError(""); setProgress("Reading workbook in background…");
    try {
      worker.current?.terminate();
      worker.current = new Worker(new URL("./workbook.worker.js", import.meta.url), { type: "module" });
      worker.current.onmessage = event => { const task = pending.current.get(event.data.requestId); if (!task) return; pending.current.delete(event.data.requestId); event.data.error ? task.reject(new Error(event.data.error)) : task.resolve(event.data.data); };
      worker.current.onerror = () => { for (const task of pending.current.values()) task.reject(new Error("Workbook worker failed. Try a smaller file.")); pending.current.clear(); };
      const buffer = await source.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))].map(n => n.toString(16).padStart(2, "0")).join("");
      const expected = restore || resumePlan;
      if (expected && expected.fileHash !== digest) throw new Error("Resume requires the exact original workbook; this file is different.");
      const data = await request("open", { buffer });
      const preferred = getDefaultStudentSheet(data.names);
      const roles = Object.fromEntries(data.names.map(name => [name, isHistoricalAttendanceSheet(name) ? "attendance" : name === preferred ? "record" : "ignore"]));
      setFile(source); setHash(digest); loadedHash.current = digest; setSheetRoles(expected?.plan?.sheetRoles || roles);
      setRecords({}); setBlocks([]); setResult(null); setPhase("setup"); setSelected([]); setDecisions({}); setQuery(""); setPage(0);
      if (expected) { setResumePlan(expected); setMode(expected.mode); setBranch(expected.plan.branch); setBatch(expected.plan.batch); setScope(expected.plan.scope); setPolicy(expected.plan.policy); setDuplicateMode(expected.plan.duplicateMode); setOverrides(expected.plan.overrides || {}); }
      else { setJob(null); setResumePlan(null); setOverrides({}); }
    } catch (e) { setError(errorText(e)); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };

  const analyze = async () => {
    if (flight.current) return;
    if (!file || hash !== loadedHash.current) { setError("Choose the workbook first."); return; }
    if (!branch || !batch || !batchOptions.some(item => id(item) === batch)) { setError("Choose a destination branch and batch."); return; }
    const choices = Object.entries(sheetRoles).filter(([, role]) => role !== "ignore" && (role === "record" ? mode !== "attendance" : mode !== "students"));
    if (!choices.length || (mode !== "students" && !choices.some(([, role]) => role === "attendance")) || (mode === "students" && !choices.some(([, role]) => role === "record"))) { setError("Assign a worksheet to each selected import type."); return; }
    flight.current = true; setBusy(true); setError("");
    try {
      const nextRecords = {}, nextBlocks = [], notes = [];
      for (const [sheet, role] of choices) {
        setProgress(`Analysing ${sheet}…`);
        const data = await request(role, { sheet });
        if (role === "record") {
          const saved = resumePlan?.plan?.mappings?.[sheet] || mappingProfiles[JSON.stringify(data.grid[data.headerIndex] || [])];
          nextRecords[sheet] = { ...data, headerIndex: saved?.headerIndex ?? data.headerIndex, mapping: saved?.mapping || buildAutoMapping(data.grid[data.headerIndex] || []) };
          if (data.warning) notes.push(`${sheet}: ${data.warning}`);
        } else {
          nextBlocks.push(...(data.blocks || []));
          if (!data.blocks?.length) notes.push(`${sheet}: no supported month blocks. This parser expects the historical monthly layout (A:AN, first 10,000 rows).`);
          notes.push(...(data.warnings || []).map(text => `${sheet}: ${text}`));
        }
      }
      if (mode !== "students" && !nextBlocks.length) throw new Error("No supported attendance blocks. Nothing imported. Check worksheet roles/layout.");
      setRecords(nextRecords); setBlocks(nextBlocks); setMonths(resumePlan?.plan?.months || nextBlocks.map(block => block.blockId)); setWarnings(notes);
      setSelected(resumePlan?.plan?.selected || []); setDecisions(resumePlan?.plan?.decisions || {}); setPhase("scope"); setPage(0);
    } catch (e) { setError(errorText(e)); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };

  const recordRows = useMemo(() => Object.entries(records).flatMap(([sheet, data]) => selectableRecordRows(data.grid, data.headerIndex, data.mapping, sheet)), [records]);
  const directoryItems = useMemo(() => directory(recordRows, blocks.filter(block => months.includes(block.blockId))), [recordRows, blocks, months]);
  const selectedItems = useMemo(() => directoryItems.filter(item => scope === "all" || selected.includes(item.key)), [directoryItems, scope, selected]);
  const suggestions = useMemo(() => Object.fromEntries(selectedItems.map(item => [item.key, suggest(item, students, batch)])), [selectedItems, students, batch]);
  const category = key => decisions[key] === "__skip__" ? "excluded" : decisions[key] === "__new__" ? "new" : decisions[key] ? "matched" : "review";
  const rows = (phase === "review" ? selectedItems : directoryItems).filter(item => norm(`${item.name} ${item.phone} ${item.row.admissionNumber || ""}`).includes(norm(query)) && (phase !== "review" || tab === "all" || category(item.key) === tab));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)), currentPage = Math.min(page, pages - 1);
  const eligibleStudents = students.filter(s => (!s.batch || id(s.batch) === batch) && s.status !== "left" && norm(`${studentName(s)} ${s.phone} ${s.admissionNumber}`).includes(norm(existingQuery)));
  const unresolved = selectedItems.filter(item => !decisions[item.key]);
  const included = selectedItems.filter(item => decisions[item.key] && decisions[item.key] !== "__skip__");
  const toggle = key => setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  const review = () => {
    if (!selectedItems.length) { setError("Select at least one player."); return; }
    if (resumePlan?._id) { setDecisions(resumePlan.plan.decisions); setPhase("review"); setTab("all"); setQuery(""); setPage(0); setError(""); return; }
    const next = { ...decisions }, used = new Set(Object.values(next).filter(value => value && !value.startsWith("__")));
    for (const item of selectedItems) if (!next[item.key]) { const value = suggestions[item.key]?.value; if (value && !used.has(value)) { next[item.key] = value; used.add(value); } }
    setDecisions(next); setPhase("review"); setTab("all"); setQuery(""); setPage(0); setError("");
  };
  const plan = () => ({ sheetRoles, branch, batch, scope, selected, decisions, months, policy, duplicateMode, overrides, mappings: Object.fromEntries(Object.entries(records).map(([sheet, data]) => [sheet, { headerIndex: data.headerIndex, mapping: data.mapping }])) });
  const saveDraft = async () => {
    try { await draftStore(draftKey, { file, fileHash: hash, mode, plan: plan(), _id: job?._id }); setDraftExists(true); setProgress("Draft saved on this browser. Use Resume draft to continue."); }
    catch (e) { setError(`Draft not saved: ${errorText(e)}`); }
  };
  const saveMappings = async () => {
    const profiles = { ...mappingProfiles };
    for (const data of Object.values(records)) profiles[JSON.stringify(data.grid[data.headerIndex] || [])] = { headerIndex: data.headerIndex, mapping: data.mapping };
    try { await draftStore(`mappings:${draftKey}`, profiles); setMappingProfiles(profiles); setProgress("Mapping profile saved for identical headers on this browser."); }
    catch (e) { setError(`Mapping not saved: ${errorText(e)}`); }
  };
  const restoreDraft = async () => { const value = await draftStore(draftKey); if (!value) return; setJob(value._id ? { _id: value._id } : null); await openFile(value.file, value); };
  const selectSession = async session => {
    try { const data = unwrap(await api.get(`/import-sessions/${session._id}`)); setJob(data); setResumePlan(data); setFile(null); setHash(""); setPhase("setup"); setMode(data.mode); setBranch(data.plan.branch); setBatch(data.plan.batch); setProgress("Choose the exact original workbook to resume. Completed chunks are replayed without writing twice."); }
    catch (e) { setError(errorText(e)); }
  };

  const execute = async (matchedOnly = false) => {
    if (flight.current || !included.length) return;
    if (!matchedOnly && unresolved.length) { setError("Resolve pending players or choose Import verified only."); return; }
    flight.current = true; stop.current = false; setBusy(true); setError(""); const totals = emptyResult();
    let session = job;
    try {
      if (resumePlan?._id && JSON.stringify(resumePlan.plan) !== JSON.stringify(plan())) throw new Error("Resume settings changed. Start a new import after checking the saved results.");
      if (!session?._id) { session = unwrap(await api.post("/import-sessions", { fileName: file.name, fileHash: hash, mode, plan: plan() })); setJob(session); setResumePlan(session); }
      const links = {};
      const payloadRows = included.map(item => ({ ...item.row, name: item.name, sourceRowKey: item.key, confirmedStudentId: decisions[item.key], replaceFields: overrides[item.key] || [], ...(item.record ? {} : { status: "inactive", importSource: "excel-attendance" }) }));
      let index = 0;
      for (const part of chunks(payloadRows)) {
        if (stop.current) break;
        setProgress(`Saving student identities: chunk ${index + 1}…`);
        const data = unwrap(await api.post("/students/import", { students: part, duplicateMode: "skip", allowProvisional: true, includeImportedStudents: true, preserveMissingDates: true, existingPolicy: mode === "attendance" ? "keep" : policy, destination: { branchMode: "existing", branchId: branch, batchMode: "existing", batchId: batch }, importSessionId: session._id, importChunkKey: `students-${index++}` }));
        totals.created += data.imported || 0; totals.updated += data.updated || 0; totals.unchanged += Math.max(0, (data.skipped || 0) - (data.updated || 0)); totals.failed += data.failed || 0;
        totals.errors.push(...(data.errors || []).map(e => ({ stage: "students", ...e })));
        for (const student of data.importedStudents || []) links[student.sourceRowKey] = student.studentId;
        setResult({ ...totals });
      }
      if (!stop.current && mode !== "students") {
        const tasks = attendancePayloads(included, links, batch, duplicateMode);
        for (let i = 0; i < tasks.length; i++) {
          if (stop.current) break;
          setProgress(`Saving attendance: chunk ${i + 1} / ${tasks.length}…`);
          const data = unwrap(await api.post("/attendance/import", { ...tasks[i], sourceWorkbook: file.name, importSessionId: session._id, importChunkKey: `attendance-${i}` }));
          totals.attendance += data.imported || 0; totals.skipped += data.skipped || 0; totals.failed += data.failed || 0; totals.metadata += data.metadataUpdated || 0;
          totals.errors.push(...(data.errors || []).map(e => ({ stage: "attendance", ...e })));
          setResult({ ...totals });
        }
      }
      const status = stop.current ? "paused" : totals.failed || unresolved.length ? "partial" : "completed";
      await api.patch(`/import-sessions/${session._id}`, { status });
      setResult(totals); setPhase("result"); setProgress(status === "paused" ? "Paused after the current chunk. Saved data remains saved." : "Import finished. Review the counts below.");
      await refresh();
    } catch (e) {
      setError(`${errorText(e)} Earlier confirmed chunks remain saved. Resume the same session with the same file/settings; uncertain chunks require review.`);
      setResult(totals); setPhase("result");
      if (session?._id) await api.patch(`/import-sessions/${session._id}`, { status: "partial" }).catch(() => {});
    } finally { flight.current = false; setBusy(false); }
  };
  const downloadErrors = () => {
    const rows = [["Stage", "Row", "Message"], ...(result?.errors || []).map(e => [e.stage, e.rowNumber || e.date || "", e.message])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + safeCsv(rows)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "import-errors.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const reset = () => { if (!busy) { setJob(null); setResumePlan(null); setFile(null); setHash(""); setRecords({}); setBlocks([]); setResult(null); setPhase("setup"); setError(""); setProgress(""); } };

  return <div className={styles.page}>
    <header className={styles.heading}><div><span>DATA MANAGEMENT</span><h1>Imports</h1><p>One workspace for student records and attendance. Nothing is saved until you confirm.</p></div><button disabled={busy} onClick={reset}>New import</button></header>
    <nav className={styles.steps} aria-label="Import stages">{["setup", "scope", "review", "result"].map((step, i) => <span key={step} aria-current={phase === step ? "step" : undefined}>{i + 1}. {({ setup: "Workbook", scope: "Players & mapping", review: "Matching & preview", result: "Result" })[step]}</span>)}</nav>
    {error && <p className={styles.error} role="alert">{error}</p>}{progress && <p className={styles.notice} role="status">{progress}</p>}
    {busy && <button onClick={phase === "review" || phase === "result" ? () => { stop.current = true; setProgress("Pausing after the current save…"); } : cancelAnalysis}>{phase === "review" || phase === "result" ? "Pause after current chunk" : "Cancel analysis"}</button>}
    <fieldset disabled={busy} className={styles.fieldset}>
    {phase === "setup" && <>
      <section className={styles.card}><h2><UploadCloud size={19} /> Workbook</h2><button className={styles.drop} onClick={() => fileInput.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); openFile(e.dataTransfer.files?.[0]); }}><FileSpreadsheet /><strong>{file?.name || "Drop Excel file here or click anywhere"}</strong><small>XLSX / XLS / CSV · Maximum 60 MB · Processed in a background worker</small></button><input ref={fileInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => { const selectedFile = e.target.files?.[0]; e.target.value = ""; openFile(selectedFile); }} />
      {draftExists && <div className={styles.actions}><button onClick={() => restoreDraft().catch(e => setError(errorText(e)))}>Resume browser draft</button><button onClick={() => draftStore(draftKey, undefined, true).then(() => setDraftExists(false)).catch(e => setError(errorText(e)))}>Delete browser draft</button></div>}
      {hash && sessions.some(session => session.fileHash === hash) && <p className={styles.notice}>This exact workbook was imported before. Review history below; duplicate handling still depends on student/date identity.</p>}
      </section>
      <section className={styles.card}><h2>What do you want to import?</h2><div className={styles.actions}>{[["students", "Student Records"], ["attendance", "Attendance"], ["both", "Records + Attendance"]].map(([value, label]) => <button key={value} aria-pressed={mode === value} disabled={Boolean(resumePlan)} onClick={() => setMode(value)}>{label}</button>)}</div><p>Attendance fee labels are historical information, not payment transactions or receipts.</p></section>
      {file && <section className={styles.card}><h2>Worksheet classification</h2><div className={styles.sheetGrid}>{Object.entries(sheetRoles).map(([sheet, role]) => <label key={sheet}><span>{sheet}</span><select disabled={Boolean(resumePlan)} value={role} onChange={e => setSheetRoles(values => ({ ...values, [sheet]: e.target.value }))}><option value="record">Student Record</option><option value="attendance">Attendance</option><option value="ignore">Ignore</option></select></label>)}</div><p>Attendance currently supports the historical monthly-table layout. Other formats are rejected with a warning; Balance/REPORT sheets are not payment imports.</p></section>}
      <section className={styles.card}><h2>Destination</h2><div className={styles.actions}><label>Branch<select disabled={Boolean(resumePlan)} value={branch} onChange={e => { setBranch(e.target.value); setBatch(""); }}><option value="">Select branch</option>{branches.map(item => <option key={id(item)} value={id(item)}>{item.branchName}</option>)}</select></label><Link to="/branches/new" target="_blank" rel="noreferrer">Add new branch ↗</Link><label>Batch<select disabled={Boolean(resumePlan)} value={batch} onChange={e => setBatch(e.target.value)}><option value="">Select batch</option>{batchOptions.map(item => <option key={id(item)} value={id(item)}>{item.batchName}</option>)}</select></label><Link to="/batches/new" target="_blank" rel="noreferrer">Add new batch ↗</Link><button onClick={() => refresh().catch(e => setError(errorText(e)))}><RefreshCw size={15} /> Refresh lists</button></div><p>New branches/batches use their existing validated forms. Return here and refresh after creating them.</p></section>
      <button className={styles.primary} disabled={!file || !batch} onClick={analyze}>Analyse selected sheets</button>
    </>}
    {phase === "scope" && <>
      {Object.entries(records).map(([sheet, data]) => <section key={sheet} className={styles.card}><h2>{sheet} — column mapping</h2><label>Header row<input type="number" min="1" max={data.grid.length} value={data.headerIndex + 1} onChange={e => { const index = Math.max(0, Math.min(data.grid.length - 1, Number(e.target.value) - 1)); setRecords(all => ({ ...all, [sheet]: { ...data, headerIndex: index, mapping: buildAutoMapping(data.grid[index] || []) } })); setSelected([]); setDecisions({}); }} /></label><div className={styles.mapping}>{STUDENT_IMPORT_FIELDS.map(field => <label key={field.key}>{field.label}<select className={data.mapping[field.key] === undefined || data.mapping[field.key] === "" ? styles.unmapped : ""} value={data.mapping[field.key] ?? ""} onChange={e => { setRecords(all => ({ ...all, [sheet]: { ...data, mapping: { ...data.mapping, [field.key]: e.target.value } } })); setSelected([]); setDecisions({}); }}><option value="">Ignore / unavailable</option>{(data.grid[data.headerIndex] || []).map((header, index) => <option key={index} value={index}>{String(header || `Column ${index + 1}`)}</option>)}</select></label>)}</div><details><summary>First 5 source rows</summary><div className={styles.table}><table><tbody>{data.grid.slice(data.headerIndex + 1, data.headerIndex + 6).map((row, i) => <tr key={i}>{row.slice(0, 10).map((value, j) => <td key={j}>{String(value ?? "")}</td>)}</tr>)}</tbody></table></div></details></section>)}
      {blocks.length > 0 && <section className={styles.card}><h2>Attendance months</h2><div className={styles.actions}>{blocks.map(block => <label key={block.blockId}><input type="checkbox" checked={months.includes(block.blockId)} onChange={() => { setMonths(values => values.includes(block.blockId) ? values.filter(value => value !== block.blockId) : [...values, block.blockId]); setDecisions({}); setSelected([]); }} />{block.sheetName}: {block.month}/{block.year}</label>)}</div></section>}
      <section className={styles.card}><h2>Choose import scope</h2><div className={styles.actions}><button aria-pressed={scope === "all"} onClick={() => setScope("all")}>All players</button><button aria-pressed={scope === "selected"} onClick={() => setScope("selected")}>Individual / multiple players</button><strong>{selectedItems.length} selected / {directoryItems.length} source identities</strong></div><p>Repeated attendance identities are grouped. Identical names without identifiers may represent different people—review before creating records.</p></section>
    </>}
    {(phase === "scope" || phase === "review") && <section className={styles.card}>
      <h2>{phase === "review" ? "Student matching" : "Workbook players"}</h2>
      {phase === "review" && <><div className={styles.actions}>{["all", "matched", "review", "new", "excluded"].map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setPage(0); }}>{value} ({value === "all" ? selectedItems.length : selectedItems.filter(item => category(item.key) === value).length})</button>)}</div><div className={styles.actions}><label>Existing profile policy<select value={policy} onChange={e => setPolicy(e.target.value)} disabled={Boolean(job) || mode === "attendance"}><option value="fill-empty">Fill blank supported fields only</option><option value="keep">Keep existing profile unchanged</option><option value="review">Review and select individual fields</option></select></label><label>Existing attendance<select value={duplicateMode} onChange={e => setDuplicateMode(e.target.value)} disabled={Boolean(job)}><option value="skip">Skip existing marks (fill missing metadata)</option><option value="overwrite">Replace marks and imported metadata</option></select></label><input placeholder="Find existing app student…" aria-label="Find existing student" value={existingQuery} onChange={e => setExistingQuery(e.target.value)} /></div><p>Non-empty values are preserved unless you explicitly select fields in Review mode. Attendance-only mode keeps existing profiles unchanged. New attendance-only profiles are inactive/incomplete. Records save before attendance; closing does not undo saved data.</p><button disabled={Boolean(job)} onClick={() => setDecisions(values => ({ ...values, ...Object.fromEntries(unresolved.map(item => [item.key, "__new__"])) }))}>Stage all unresolved as new records ({unresolved.length})</button></>}
      <div className={styles.actions}><Search size={17} /><input aria-label="Search workbook players" placeholder="Search name, phone or admission…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} />{phase === "scope" && scope === "selected" && <><button onClick={() => setSelected(values => [...new Set([...values, ...rows.map(item => item.key)])])}>Select search results</button><button onClick={() => setSelected([])}>Clear selection</button></>}</div>
      <div className={styles.table}><table><thead><tr>{phase === "scope" && <th>Select</th>}<th>Player</th><th>Source / details</th><th>Attendance cells</th>{phase === "review" && <th>Confirm identity</th>}</tr></thead><tbody>{rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <tr key={item.key} onClick={e => { if (phase === "scope" && scope === "selected" && !e.target.closest("input,button,select,details")) toggle(item.key); }}>
        {phase === "scope" && <td><input aria-label={`Select ${item.name}`} type="checkbox" disabled={scope === "all"} checked={scope === "all" || selected.includes(item.key)} onChange={() => toggle(item.key)} /></td>}<td><strong>{item.name}</strong><small>{item.phone || "No phone"}</small></td><td><span className={item.record ? styles.badge : styles.warnBadge}>{item.record ? "Record available" : "Attendance only"}</span><small>{item.sources.join(", ")}</small><small>{[item.row.schoolName, item.row.beltRank, item.row.dateOfBirth].filter(Boolean).join(" · ")}</small></td><td>{item.attendance.reduce((sum, row) => sum + (row.attendance?.length || 0), 0)}</td>
        {phase === "review" && <td><small>{suggestions[item.key]?.reason}</small><select disabled={Boolean(job)} className={!decisions[item.key] ? styles.unmapped : ""} value={decisions[item.key] || ""} onChange={e => setDecisions(values => ({ ...values, [item.key]: e.target.value }))}><option value="">Review / select existing student</option><option value="__new__">Create new student record</option><option value="__skip__">Exclude this player</option>{students.filter(s => id(s) === decisions[item.key] || eligibleStudents.includes(s)).filter(s => id(s) === decisions[item.key] || !Object.entries(decisions).some(([key, value]) => key !== item.key && value === id(s))).sort((a, b) => studentName(a).trim().localeCompare(studentName(b).trim(), "en", { sensitivity: "base", numeric: true })).map(s => <option key={id(s)} value={id(s)}>{studentName(s)} · {s.phone || s.admissionNumber}</option>)}</select>{decisions[item.key] === "__new__" && <small>Will create {item.record ? "mapped profile" : "inactive incomplete profile"} only when Import is clicked.</small>}</td>}
      </tr>)}</tbody></table></div>{!rows.length && <p>No players found. Check the chosen sheets and Name mapping.</p>}<div className={styles.actions}><button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} / {pages}</span><button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
    </section>}
    {phase === "review" && policy === "review" && mode !== "attendance" && <section className={styles.card}><h2>Review profile changes — current table page</h2><p>Only checked fields will be replaced. Names/admission identifiers are never changed here. Medical arrays and other hidden fields should be reviewed in Edit Student.</p>{rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => { const existing = students.find(s => id(s) === decisions[item.key]); if (!existing) return null; const fields = reviewFields.filter(field => field !== "medicalConditions" && item.row[field] !== undefined && String(item.row[field]).trim() && !/^[—–-]+$/.test(String(item.row[field]).trim())); return <details key={item.key}><summary>{item.name} → {studentName(existing)} ({overrides[item.key]?.length || 0} fields selected)</summary><div className={styles.table}><table><thead><tr><th>Replace</th><th>Field</th><th>Existing</th><th>Excel</th></tr></thead><tbody>{fields.map(field => <tr key={field}><td><input type="checkbox" disabled={Boolean(job)} checked={overrides[item.key]?.includes(field) || false} onChange={() => setOverrides(values => { const current = values[item.key] || []; return { ...values, [item.key]: current.includes(field) ? current.filter(value => value !== field) : [...current, field] }; })} /></td><td>{field}</td><td>{String(existing[field] ?? "Empty")}</td><td>{String(item.row[field])}</td></tr>)}</tbody></table></div></details>; })}</section>}
    {warnings.length > 0 && <details className={styles.card}><summary>Parsing warnings ({warnings.length})</summary>{warnings.map((warning, index) => <p key={index}>{warning}</p>)}</details>}
    {phase === "scope" && <div className={styles.actions}><button onClick={() => setPhase("setup")}>Back</button><button onClick={saveDraft}>Save browser draft</button><button onClick={saveMappings}>Save mapping profile</button><button className={styles.primary} disabled={!selectedItems.length} onClick={review}>Review selected players</button></div>}
    {phase === "review" && <section className={styles.card}><h2>Final preview</h2><p>{included.length} verified/staged players · {included.filter(item => decisions[item.key] === "__new__").length} new records · {unresolved.length} pending · {selectedItems.filter(item => decisions[item.key] === "__skip__").length} excluded</p><p>Mode: {mode}. Destination: {batchOptions.find(item => id(item) === batch)?.batchName}. Attendance is imported only for identities whose student step succeeds.</p><div className={styles.actions}><button disabled={Boolean(job)} onClick={() => setPhase("scope")}>Back</button><button onClick={saveDraft}>Save browser draft</button><button className={styles.primary} disabled={!included.length || Boolean(unresolved.length)} onClick={() => execute(false)}>Import all verified data</button>{unresolved.length > 0 && <button disabled={!included.length} onClick={() => execute(true)}>Import verified only — leave pending</button>}</div></section>}
    {phase === "result" && result && <section className={styles.card}><h2>Import result</h2><div className={styles.stats}>{Object.entries(result).filter(([key]) => key !== "errors").map(([key, value]) => <article key={key}><small>{key}</small><strong>{value}</strong></article>)}</div><p>Counts describe confirmed API responses. Review failed rows before assuming every selected player was imported. Attendance metadata is not a fee receipt.</p><div className={styles.actions}><Link to="/students">View students</Link><Link to={`/attendance?batch=${batch}`}>View attendance</Link><button onClick={downloadErrors}>Download errors CSV</button><button onClick={() => setPhase("review")}>Resume same reviewed import</button><button onClick={reset}>Start another import</button></div>{result.errors.slice(0, 100).map((e, i) => <p key={i}>{e.stage} · Row {e.rowNumber || ""}: {e.message}</p>)}</section>}
    <section className={styles.card}><h2><History size={19} /> My import history</h2><p>Latest 50 imports for your account in this academy. To resume on another device, choose the same original file. Browser drafts stay on this device.</p><div className={styles.table}><table><thead><tr><th>Workbook</th><th>Mode</th><th>Status</th><th>Started</th><th>Action</th></tr></thead><tbody>{sessions.map(session => <tr key={session._id}><td>{session.fileName}</td><td>{session.mode}</td><td>{session.status}</td><td>{new Date(session.createdAt).toLocaleString()}</td><td><div className={styles.actions}><button onClick={async () => { try { setHistoryDetail(unwrap(await api.get(`/import-sessions/${session._id}`))); } catch(e) { setError(errorText(e)); } }}>Details</button><button onClick={() => selectSession(session)}>Resume</button></div></td></tr>)}</tbody></table></div>
    {historyDetail && <div><h3>{historyDetail.fileName}</h3><div className={styles.stats}>{Object.entries(journalSummary(historyDetail.chunks)).map(([key, value]) => <article key={key}><small>{key}</small><strong>{value}</strong></article>)}</div><p>Uncertain chunks must be checked before retrying. A failed API response may contain earlier saved data; do not assume rollback.</p><div className={styles.table}><table><thead><tr><th>Chunk</th><th>Status</th><th>Result</th></tr></thead><tbody>{historyDetail.chunks?.map(chunk => <tr key={chunk._id}><td>{chunk.key}</td><td>{chunk.status}</td><td>{chunk.response?.message || "Waiting / uncertain"}</td></tr>)}</tbody></table></div><button onClick={() => setHistoryDetail(null)}>Close details</button></div>}
    </section>
    </fieldset>
  </div>;
}
