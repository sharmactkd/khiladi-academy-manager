import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarDays, Check, ChevronDown, ChevronRight, CircleCheck, FileSpreadsheet, GraduationCap, History, MapPin, Phone, RefreshCw, Search, ShieldCheck, Sparkles, Stethoscope, UploadCloud, UserRound } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import api from "../../api/api.js";
import { getDefaultStudentSheet, buildAutoMapping, STUDENT_IMPORT_FIELDS } from "../../utils/studentExcelImport.js";
import { selectableRecordRows } from "../../utils/selectiveWorkbookImport.js";
import { isHistoricalAttendanceSheet } from "../../utils/attendanceExcelImport.js";
import { attendanceSourceKey } from "../../utils/attendanceImportActions.js";
import { directory, suggest, prepareImportChoices, importCandidates, chunks, attendancePayloads, id, list, norm, studentName, unwrap, safeCsv, journalSummary } from "./importLogic.js";
import { draftStore } from "./draftStore.js";
import styles from "./Imports.module.css";

const errorText = error => error?.response?.data?.message || error.message || "Operation failed";
const emptyResult = () => ({ created: 0, updated: 0, unchanged: 0, attendance: 0, skipped: 0, failed: 0, metadata: 0, errors: [] });
const pageSize = 50;
const reviewFields = ["aadhaarNumber", "dateOfBirth", "phone", "email", "schoolName", "className", "section", "collegeName", "occupation", "parentName", "parentPhone", "address", "city", "state", "beltRank", "danRank", "heightCm", "weightKg", "bloodGroup", "medicalConditions", "joiningDate", "notes"];
const mappingGroups = [
  { key: "identity", label: "Student identity", hint: "Name and unique student details", icon: UserRound, fields: ["name", "firstName", "lastName", "admissionNumber", "studentCode", "dateOfBirth", "gender", "status", "aadhaarNumber"] },
  { key: "contact", label: "Contact & parent", hint: "Phone, email and guardian details", icon: Phone, fields: ["phone", "countryCode", "email", "parentName", "parentPhone", "parentCountryCode"] },
  { key: "training", label: "Training details", hint: "Batch, martial art, belt and joining date", icon: GraduationCap, fields: ["batchName", "martialArt", "beltRank", "danRank", "joiningDate"] },
  { key: "education", label: "Education & work", hint: "School, class, college and occupation", icon: FileSpreadsheet, fields: ["schoolName", "className", "section", "collegeName", "occupation"] },
  { key: "location", label: "Address", hint: "Country, state, city and full address", icon: MapPin, fields: ["country", "state", "city", "address"] },
  { key: "medical", label: "Medical & emergency", hint: "Health and emergency contact details", icon: Stethoscope, fields: ["bloodGroup", "heightCm", "weightKg", "medicalConditions", "notes", "emergencyContactName", "emergencyContactPhone", "emergencyContactCountryCode", "emergencyContactRelation"] },
];
const recommendedMappingKeys = new Set(["dateOfBirth", "phone", "joiningDate", "beltRank"]);
const fieldByKey = Object.fromEntries(STUDENT_IMPORT_FIELDS.map(field => [field.key, field]));
const monthLabels = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const reconciliationProtectedYear = new Date().getFullYear();
const isProtectedReconciliationBlock = (block, enabled) =>
  enabled && Number(block?.year) === reconciliationProtectedYear && Number(block?.month) === 9;

export default function Imports() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("type") === "attendance" ? "attendance" : "students");
  const [file, setFile] = useState(null), [hash, setHash] = useState("");
  const [sheetRoles, setSheetRoles] = useState({}), [records, setRecords] = useState({}), [blocks, setBlocks] = useState([]);
  const [months, setMonths] = useState([]), [branches, setBranches] = useState([]), [batches, setBatches] = useState([]), [students, setStudents] = useState([]);
  const [branch, setBranch] = useState(""), [batch, setBatch] = useState(params.get("batch") || "");
  const [phase, setPhase] = useState("setup"), [busy, setBusy] = useState(false), [progress, setProgress] = useState(""), [error, setError] = useState("");
  const [scope, setScope] = useState("all"), [selected, setSelected] = useState([]), [decisions, setDecisions] = useState({});
  const [query, setQuery] = useState(""), [page, setPage] = useState(0);
  const [scopeQuery, setScopeQuery] = useState("");
  const [policy, setPolicy] = useState("fill-empty"), [duplicateMode, setDuplicateMode] = useState("skip");
  const [importTarget, setImportTarget] = useState("new");
  const [reconciliationMode, setReconciliationMode] = useState(false);
  const [sessions, setSessions] = useState([]), [job, setJob] = useState(null), [result, setResult] = useState(null), [resumePlan, setResumePlan] = useState(null);
  const [warnings, setWarnings] = useState([]), [draftExists, setDraftExists] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [recoveryAudit, setRecoveryAudit] = useState(null), [auditBusy, setAuditBusy] = useState(false);
  const [duplicateChoices, setDuplicateChoices] = useState({});
  const [mappingProfiles, setMappingProfiles] = useState({});
  const [overrides, setOverrides] = useState({});
  const [mappingQuery, setMappingQuery] = useState("");
  const [expandedMappingGroups, setExpandedMappingGroups] = useState(() => new Set(["identity", "contact", "training"]));
  const [expandedIgnoredGroups, setExpandedIgnoredGroups] = useState(() => new Set());
  const [monthQuery, setMonthQuery] = useState("");
  const [expandedMonthGroups, setExpandedMonthGroups] = useState(() => new Set());
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
      setRecords({}); setBlocks([]); setResult(null); setPhase("setup"); setSelected([]); setDecisions({}); setQuery(""); setScopeQuery(""); setPage(0);
      setMonthQuery(""); setExpandedMonthGroups(new Set());
      if (expected) { setResumePlan(expected); setMode(expected.mode); setBranch(expected.plan.branch); setBatch(expected.plan.batch); setScope(expected.plan.scope); setPolicy(expected.plan.policy); setDuplicateMode(expected.plan.duplicateMode); setOverrides(expected.plan.overrides || {}); setDuplicateChoices(expected.plan.duplicateChoices || {}); setImportTarget(expected.plan.importTarget || "all"); setReconciliationMode(Boolean(expected.plan.reconciliationMode)); }
      else { setJob(null); setResumePlan(null); setOverrides({}); setDuplicateChoices({}); setImportTarget("new"); setPolicy("keep"); setDuplicateMode("skip"); setReconciliationMode(false); }
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
      const attendanceYears = [...new Set(nextBlocks.map(block => Number(block.year)))].filter(Number.isFinite).sort((a, b) => b - a);
      setRecords(nextRecords); setBlocks(nextBlocks); setMonths(resumePlan?.plan?.months || nextBlocks.filter(block => !isProtectedReconciliationBlock(block, reconciliationMode)).map(block => block.blockId)); setWarnings(notes);
      setMonthQuery(""); setExpandedMonthGroups(new Set(attendanceYears.slice(0, 2).map(String)));
      setSelected(resumePlan?.plan?.selected || []); setDecisions(resumePlan?.plan?.decisions || {}); setPhase("mapping"); setPage(0);
    } catch (e) { setError(errorText(e)); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };

  const recordRows = useMemo(() => Object.entries(records).flatMap(([sheet, data]) => selectableRecordRows(data.grid, data.headerIndex, data.mapping, sheet)), [records]);
  const directoryItems = useMemo(() => directory(recordRows, blocks.filter(block => months.includes(block.blockId))), [recordRows, blocks, months]);
  const rawSelectedItems = useMemo(() => directoryItems.filter(item => scope === "all" || selected.includes(item.key)), [directoryItems, scope, selected]);
  const duplicateGroups = useMemo(() => {
    const grouped = new Map();
    rawSelectedItems.forEach((item) => {
      const key = norm(item.name);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });
    return [...grouped.entries()].filter(([, items]) => items.length > 1);
  }, [rawSelectedItems]);
  const selectedItems = useMemo(() => {
    const consumed = new Set();
    const merged = [];
    rawSelectedItems.forEach((item) => {
      if (consumed.has(item.key)) return;
      const nameKey = norm(item.name);
      const group = rawSelectedItems.filter((candidate) => norm(candidate.name) === nameKey);
      if (group.length > 1 && duplicateChoices[nameKey] === "same") {
        const primary = group.find((candidate) => candidate.record) || group.find((candidate) => candidate.phone) || group[0];
        group.forEach((candidate) => consumed.add(candidate.key));
        merged.push({
          ...primary,
          attendance: group.flatMap((candidate) => candidate.attendance || []),
          sources: [...new Set(group.flatMap((candidate) => candidate.sources || []))],
          mergedSourceKeys: group.map((candidate) => candidate.key),
        });
      } else {
        consumed.add(item.key);
        merged.push(item);
      }
    });
    return merged;
  }, [rawSelectedItems, duplicateChoices]);
  const suggestions = useMemo(() => Object.fromEntries(selectedItems.map(item => [item.key, suggest(item, students, batch)])), [selectedItems, students, batch]);
  const category = key => decisions[key] === "__skip__" ? "excluded" : decisions[key] === "__new__" ? "new" : decisions[key] ? "matched" : "review";
  const decisionItems = selectedItems.filter(item => category(item.key) === "review" || category(item.key) === "new");
  const matchedItems = selectedItems.filter(item => category(item.key) === "matched");
  const excludedItems = selectedItems.filter(item => category(item.key) === "excluded");
  const rows = decisionItems.filter(item => norm(`${item.name} ${item.phone} ${item.row.admissionNumber || ""}`).includes(norm(query)));
  const scopeRows = directoryItems.filter(item => norm(`${item.name} ${item.phone} ${item.row.admissionNumber || ""}`).includes(norm(scopeQuery)));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)), currentPage = Math.min(page, pages - 1);
  const unresolved = selectedItems.filter(item => !decisions[item.key]);
  const included = importCandidates(selectedItems, decisions, importTarget);
  const selectedItemByKey = useMemo(() => Object.fromEntries(selectedItems.map(item => [item.key, item])), [selectedItems]);
  const linkedOwner = (studentId, itemKey) => Object.entries(decisions)
    .map(([key, value]) => value === studentId && key !== itemKey ? selectedItemByKey[key] : null)
    .find(Boolean);
  useEffect(() => { setRecoveryAudit(null); }, [selected, decisions, months]);
  const toggle = key => setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  const worksheetNames = Object.keys(sheetRoles);
  const suggestedRecordSheet = getDefaultStudentSheet(worksheetNames);
  const suggestedSheetRole = sheet => isHistoricalAttendanceSheet(sheet) ? "attendance" : sheet === suggestedRecordSheet ? "record" : "ignore";
  const groupedSheets = {
    attendance: worksheetNames.filter(sheet => sheetRoles[sheet] === "attendance"),
    record: worksheetNames.filter(sheet => sheetRoles[sheet] === "record"),
    balance: worksheetNames.filter(sheet => sheetRoles[sheet] === "ignore" && /balance/i.test(sheet)),
    other: worksheetNames.filter(sheet => sheetRoles[sheet] === "ignore" && !/balance/i.test(sheet)),
  };
  const updateSheetRole = (sheet, role) => {
    setSheetRoles(values => ({ ...values, [sheet]: role }));
    setSelected([]); setDecisions({});
  };
  const acceptSheetSuggestions = () => {
    setSheetRoles(Object.fromEntries(worksheetNames.map(sheet => [sheet, suggestedSheetRole(sheet)])));
    setSelected([]); setDecisions({});
  };
  const toggleIgnoredGroup = key => setExpandedIgnoredGroups(values => {
    const next = new Set(values); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const toggleMappingGroup = key => setExpandedMappingGroups(values => {
    const next = new Set(values); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const sortedAttendanceBlocks = useMemo(() => [...blocks].sort((a, b) => Number(b.year) - Number(a.year) || Number(a.month) - Number(b.month) || String(a.sheetName).localeCompare(String(b.sheetName))), [blocks]);
  const attendanceYears = useMemo(() => [...new Set(sortedAttendanceBlocks.map(block => Number(block.year)))].filter(Number.isFinite), [sortedAttendanceBlocks]);
  const recentAttendanceYears = attendanceYears.slice(0, 4);
  const earlierAttendanceYears = attendanceYears.slice(4);
  const normalizedMonthQuery = monthQuery.trim().toLowerCase();
  const monthMatches = block => !normalizedMonthQuery || `${monthLabels[Number(block.month)] || block.month} ${block.month} ${block.year} ${block.sheetName}`.toLowerCase().includes(normalizedMonthQuery);
  const blocksForYear = year => sortedAttendanceBlocks.filter(block => Number(block.year) === Number(year) && monthMatches(block));
  const earlierBlocks = sortedAttendanceBlocks.filter(block => earlierAttendanceYears.includes(Number(block.year)) && monthMatches(block));
  const changeMonths = updater => { setMonths(updater); setDecisions({}); setSelected([]); };
  const allowedAttendanceBlocks = values => values.filter(block => !isProtectedReconciliationBlock(block, reconciliationMode));
  const toggleMonth = blockId => changeMonths(values => values.includes(blockId) ? values.filter(value => value !== blockId) : [...values, blockId]);
  const setMonthGroupSelection = (groupBlocks, shouldSelect) => {
    const ids = new Set(allowedAttendanceBlocks(groupBlocks).map(block => block.blockId));
    changeMonths(values => shouldSelect ? [...new Set([...values, ...ids])] : values.filter(value => !ids.has(value)));
  };
  const toggleMonthGroup = key => setExpandedMonthGroups(values => {
    const next = new Set(values); next.has(String(key)) ? next.delete(String(key)) : next.add(String(key)); return next;
  });
  const review = async () => {
    if (flight.current) return;
    if (!selectedItems.length) { setError("Select at least one player."); return; }
    if (resumePlan?._id) { setDecisions(resumePlan.plan.decisions); setPhase("review"); setQuery(""); setPage(0); setError(""); return; }
    flight.current = true; setBusy(true); setProgress("Checking saved students in your app…"); setError("");
    try {
      const data = unwrap(await api.get("/students"));
      const savedStudents = Array.isArray(data) ? data : data?.students;
      if (!Array.isArray(savedStudents)) throw new Error("Could not verify saved students. Please try again; no records were created.");
      setStudents(savedStudents);
      setDecisions(prepareImportChoices(selectedItems, savedStudents, batch, decisions));
      setPhase("review"); setQuery(""); setPage(0);
    } catch (e) { setError(errorText(e)); }
    finally { flight.current = false; setBusy(false); setProgress(""); }
  };
  const runRecoveryAudit = async () => {
    const auditRows = selectedItems.flatMap((item) => item.attendance || []);
    if (!auditRows.length) { setError("Selected players have no attendance rows to compare."); return; }
    setAuditBusy(true); setError(""); setProgress("Comparing Excel attendance with saved app data…");
    try {
      const combined = { rows: [], summary: { missingMonths: 0, partialMonths: 0, missingCells: 0, conflicts: 0, missingMetadataMonths: 0 } };
      for (const part of chunks(auditRows, 300)) {
        const resolutions = {};
        selectedItems.forEach((item) => {
          const choice = decisions[item.key];
          if (!choice || choice.startsWith("__")) return;
          (item.attendance || []).forEach((row) => {
            if (part.includes(row)) resolutions[attendanceSourceKey(row)] = choice;
          });
        });
        const response = unwrap(await api.post("/attendance/import/preview", { rows: part, fallbackBatch: batch, resolutions }));
        combined.rows.push(...(response.audit?.rows || []));
        Object.keys(combined.summary).forEach((key) => { combined.summary[key] += Number(response.audit?.summary?.[key] || 0); });
      }
      combined.identity = {
        selected: selectedItems.length,
        missing: selectedItems.filter((item) => decisions[item.key] === "__new__").length,
        unresolved: selectedItems.filter((item) => !decisions[item.key]).length,
        linked: selectedItems.filter((item) => decisions[item.key] && !decisions[item.key].startsWith("__")).length,
        duplicateGroups: duplicateGroups.length,
      };
      setRecoveryAudit(combined);
    } catch (e) { setError(errorText(e)); }
    finally { setAuditBusy(false); setProgress(""); }
  };
  const plan = () => ({ sheetRoles, branch, batch, scope, selected, decisions, months, policy, duplicateMode, overrides, duplicateChoices, importTarget, reconciliationMode, mappings: Object.fromEntries(Object.entries(records).map(([sheet, data]) => [sheet, { headerIndex: data.headerIndex, mapping: data.mapping }])) });
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
        for (const row of part) {
          if (!links[row.sourceRowKey]) {
            totals.errors.push({ stage: "students", message: `${row.name}: no saved student ID returned. Attendance not imported for this player. Check row errors / plan capacity.` });
            if (!(data.failed > 0)) totals.failed += 1;
          }
        }
        setResult({ ...totals });
      }
      if (!stop.current && mode !== "students") {
        const tasks = attendancePayloads(included, links, batch, duplicateMode, reconciliationMode);
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
  const reset = () => { if (!busy) { setJob(null); setResumePlan(null); setFile(null); setHash(""); setRecords({}); setBlocks([]); setResult(null); setRecoveryAudit(null); setDuplicateChoices({}); setPhase("setup"); setError(""); setProgress(""); } };

  return <div className={styles.page}>
    <header className={styles.heading}><div><span>DATA MANAGEMENT</span><h1>Imports</h1><p>One workspace for student records and attendance. Nothing is saved until you confirm.</p></div><div className={styles.actions}><Link to="/imports/fee-reconciliation">Reconcile imported fees</Link><button disabled={busy} onClick={reset}>New import</button></div></header>
    <nav className={styles.steps} aria-label="Import stages">{["setup", "mapping", "review", "confirm", "result"].map((step, i) => <span key={step} aria-current={phase === step ? "step" : undefined}>{i + 1}. {({ setup: "File & sheets", mapping: "Match Excel columns", review: "Select & match students", confirm: "Review & import", result: "Result" })[step]}</span>)}</nav>
    <p className={styles.notice}>{({
      setup: "Choose your file, import type, source sheets and destination branch/batch. Nothing is imported at this step.",
      mapping: "Tell the app which Excel columns contain name, phone, DOB, school, belt and other details. Choose attendance months below when applicable.",
      review: "Choose who to import and resolve only unmatched players. Safe matches stay out of the main table and can be reviewed separately. Nothing is saved yet.",
      confirm: "Check the counts and destination. Only the final Import buttons below start saving. Profiles save first, then attendance links to successful student records.",
      result: "Review confirmed successes and failures. Closing this page does not undo data already saved.",
    })[phase]}</p>
    {error && <p className={styles.error} role="alert">{error}</p>}{progress && <p className={styles.notice} role="status">{progress}</p>}
    {busy && ["setup", "confirm", "result"].includes(phase) && <button onClick={phase === "confirm" || phase === "result" ? () => { stop.current = true; setProgress("Pausing after the current save…"); } : cancelAnalysis}>{phase === "confirm" || phase === "result" ? "Pause after current chunk" : "Cancel analysis"}</button>}
    <fieldset disabled={busy} className={styles.fieldset}>
    {phase === "setup" && <>
      <section className={styles.card}><h2><UploadCloud size={19} /> Workbook</h2><button className={styles.drop} onClick={() => fileInput.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); openFile(e.dataTransfer.files?.[0]); }}><FileSpreadsheet /><strong>{file?.name || "Drop Excel file here or click anywhere"}</strong><small>XLSX / XLS / CSV · Maximum 60 MB · Processed in a background worker</small></button><input ref={fileInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => { const selectedFile = e.target.files?.[0]; e.target.value = ""; openFile(selectedFile); }} />
      {draftExists && <div className={styles.actions}><button onClick={() => restoreDraft().catch(e => setError(errorText(e)))}>Resume browser draft</button><button onClick={() => draftStore(draftKey, undefined, true).then(() => setDraftExists(false)).catch(e => setError(errorText(e)))}>Delete browser draft</button></div>}
      {hash && sessions.some(session => session.fileHash === hash) && <p className={styles.notice}>This exact workbook was imported before. Review history below; duplicate handling still depends on student/date identity.</p>}
      </section>
      <section className={styles.card}><h2>What do you want to import?</h2><div className={styles.actions}>{[["students", "Student Records"], ["attendance", "Attendance"], ["both", "Records + Attendance"]].map(([value, label]) => <button key={value} aria-pressed={mode === value} disabled={Boolean(resumePlan)} onClick={() => setMode(value)}>{label}</button>)}</div><p>Attendance fee labels are historical information, not payment transactions or receipts.</p></section>
      <section className={styles.card}><h2>Temporary Ground.xlsx recovery</h2><label><input type="checkbox" checked={reconciliationMode} disabled={Boolean(resumePlan)} onChange={e => { const enabled = e.target.checked; setReconciliationMode(enabled); if (enabled) { setMode("both"); setImportTarget("all"); setPolicy("fill-empty"); setDuplicateMode("skip"); setScope("all"); } }} /> Safely merge missing records and historical attendance</label><p>Existing profile fields and attendance marks are never replaced. Only September {reconciliationProtectedYear} is excluded here and blocked again by the backend; older September records remain importable.</p></section>
      {file && <section className={`${styles.card} ${styles.classificationCard}`}>
        <div className={styles.classificationHeader}>
          <div><h2>Worksheet classification</h2><p>We grouped your worksheets automatically. Review only the sheets that look incorrect.</p></div>
          <span className={styles.detectedPill}><Sparkles size={14} /> Auto-detected</span>
        </div>
        <div className={styles.classificationStats} aria-label="Worksheet classification summary">
          <span><strong>{groupedSheets.attendance.length}</strong> Attendance</span>
          <span><strong>{groupedSheets.record.length}</strong> Student record</span>
          <span><strong>{groupedSheets.balance.length + groupedSheets.other.length}</strong> Ignored</span>
        </div>
        <div className={styles.classificationActions}>
          <button type="button" disabled={Boolean(resumePlan)} onClick={acceptSheetSuggestions}><Sparkles size={15} /> Accept all suggestions</button>
          <small>Every sheet remains editable before analysis.</small>
        </div>
        <div className={styles.sheetGroups}>
          {[{ key: "attendance", label: "Attendance sheets", icon: CalendarDays }, { key: "record", label: "Student record sheets", icon: UserRound }].map(group => {
            const Icon = group.icon;
            return <article key={group.key} className={styles.sheetRoleCard}>
              <header><span className={styles.sheetGroupIcon}><Icon size={18} /></span><div><strong>{group.label}</strong><small>{groupedSheets[group.key].length} worksheet{groupedSheets[group.key].length === 1 ? "" : "s"}</small></div></header>
              <div className={styles.sheetRoleList}>{groupedSheets[group.key].length ? groupedSheets[group.key].map(sheet => <div key={sheet} className={styles.sheetRoleRow}>
                <span className={styles.sheetName}><FileSpreadsheet size={16} /><strong>{sheet}</strong></span>
                <select aria-label={`Role for ${sheet}`} disabled={Boolean(resumePlan)} value={sheetRoles[sheet]} onChange={e => updateSheetRole(sheet, e.target.value)}><option value="record">Student Record</option><option value="attendance">Attendance</option><option value="ignore">Ignore</option></select>
                <span className={sheetRoles[sheet] === suggestedSheetRole(sheet) ? styles.detectedBadge : styles.changedBadge}>{sheetRoles[sheet] === suggestedSheetRole(sheet) ? <><Check size={12} /> Detected</> : "Changed"}</span>
              </div>) : <p className={styles.emptySheetGroup}>No worksheet assigned here.</p>}</div>
            </article>;
          })}
          {[{ key: "balance", label: "Balance sheets", hint: "Not treated as payment imports" }, { key: "other", label: "Other ignored sheets", hint: "Reports and unsupported layouts" }].map(group => <article key={group.key} className={`${styles.sheetRoleCard} ${styles.ignoredSheetCard}`}>
            <button type="button" className={styles.ignoredGroupButton} onClick={() => toggleIgnoredGroup(group.key)} aria-expanded={expandedIgnoredGroups.has(group.key)}>
              <span>{expandedIgnoredGroups.has(group.key) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}<ShieldCheck size={18} /><span><strong>{group.label}</strong><small>{group.hint}</small></span></span><b>{groupedSheets[group.key].length}</b>
            </button>
            {expandedIgnoredGroups.has(group.key) && <div className={styles.sheetRoleList}>{groupedSheets[group.key].length ? groupedSheets[group.key].map(sheet => <div key={sheet} className={styles.sheetRoleRow}>
              <span className={styles.sheetName}><FileSpreadsheet size={16} /><strong>{sheet}</strong></span>
              <select aria-label={`Role for ${sheet}`} disabled={Boolean(resumePlan)} value={sheetRoles[sheet]} onChange={e => updateSheetRole(sheet, e.target.value)}><option value="record">Student Record</option><option value="attendance">Attendance</option><option value="ignore">Ignore</option></select>
              <span className={styles.mutedBadge}>Ignored</span>
            </div>) : <p className={styles.emptySheetGroup}>No worksheets in this group.</p>}</div>}
          </article>)}
        </div>
        <p className={styles.classificationNote}><AlertCircle size={15} /> Attendance supports the historical monthly-table layout. Balance/REPORT sheets are never imported as fee payments or receipts.</p>
      </section>}
      <section className={styles.card}><h2>Destination</h2><div className={styles.actions}><label>Branch<select disabled={Boolean(resumePlan)} value={branch} onChange={e => { setBranch(e.target.value); setBatch(""); }}><option value="">Select branch</option>{branches.map(item => <option key={id(item)} value={id(item)}>{item.branchName}</option>)}</select></label><Link to="/branches/new" target="_blank" rel="noreferrer">Add new branch ↗</Link><label>Batch<select disabled={Boolean(resumePlan)} value={batch} onChange={e => setBatch(e.target.value)}><option value="">Select batch</option>{batchOptions.map(item => <option key={id(item)} value={id(item)}>{item.batchName}</option>)}</select></label><Link to="/batches/new" target="_blank" rel="noreferrer">Add new batch ↗</Link><button onClick={() => refresh().catch(e => setError(errorText(e)))}><RefreshCw size={15} /> Refresh lists</button></div><p>New branches/batches use their existing validated forms. Return here and refresh after creating them.</p></section>
      <button className={styles.primary} disabled={!file || !batch} onClick={analyze}>Analyse selected sheets</button>
    </>}
    {phase === "mapping" && <>
      {Object.entries(records).map(([sheet, data]) => {
        const mappedCount = STUDENT_IMPORT_FIELDS.filter(field => data.mapping[field.key] !== undefined && data.mapping[field.key] !== "").length;
        const nameReady = (data.mapping.name !== undefined && data.mapping.name !== "") || ((data.mapping.firstName !== undefined && data.mapping.firstName !== "") && (data.mapping.lastName !== undefined && data.mapping.lastName !== ""));
        const recommendedMissing = [...recommendedMappingKeys].filter(key => data.mapping[key] === undefined || data.mapping[key] === "").length;
        const searchValue = mappingQuery.trim().toLowerCase();
        const updateMapping = (key, value) => { setRecords(all => ({ ...all, [sheet]: { ...data, mapping: { ...data.mapping, [key]: value } } })); setSelected([]); setDecisions({}); };
        const autoMap = () => { setRecords(all => ({ ...all, [sheet]: { ...data, mapping: buildAutoMapping(data.grid[data.headerIndex] || []) } })); setSelected([]); setDecisions({}); };
        return <section key={sheet} className={`${styles.card} ${styles.mappingCard}`}>
          <div className={styles.mappingHeader}>
            <div><span className={styles.eyebrow}>EXCEL COLUMN MAPPING</span><h2>{sheet} — match Excel columns</h2><p>Match each app field with its Excel column. Optional fields can safely stay ignored.</p></div>
            <label className={styles.headerRowControl}>Header row<input type="number" min="1" max={data.grid.length} value={data.headerIndex + 1} onChange={e => { const index = Math.max(0, Math.min(data.grid.length - 1, Number(e.target.value) - 1)); setRecords(all => ({ ...all, [sheet]: { ...data, headerIndex: index, mapping: buildAutoMapping(data.grid[index] || []) } })); setSelected([]); setDecisions({}); }} /></label>
          </div>
          <div className={styles.mappingSummary}>
            <span className={styles.summaryMapped}><CircleCheck size={16} /><strong>{mappedCount}</strong> mapped</span>
            <span className={recommendedMissing ? styles.summaryRecommended : styles.summaryMapped}><AlertCircle size={16} /><strong>{recommendedMissing}</strong> recommended checks</span>
            <span className={nameReady ? styles.summaryReady : styles.summaryRequired}><ShieldCheck size={16} />{nameReady ? "Required identity ready" : "Name mapping required"}</span>
          </div>
          <label className={styles.mappingSearch}><Search size={17} /><input value={mappingQuery} onChange={e => setMappingQuery(e.target.value)} placeholder="Search app fields…" aria-label="Search mapping fields" /></label>
          <div className={styles.mappingGroups}>{mappingGroups.map(group => {
            const Icon = group.icon;
            const fields = group.fields.map(key => fieldByKey[key]).filter(Boolean).filter(field => !searchValue || field.label.toLowerCase().includes(searchValue));
            if (searchValue && !fields.length) return null;
            const expanded = searchValue || expandedMappingGroups.has(group.key);
            const groupMapped = group.fields.filter(key => data.mapping[key] !== undefined && data.mapping[key] !== "").length;
            return <article key={group.key} className={styles.mappingGroup}>
              <button type="button" className={styles.mappingGroupHeader} onClick={() => toggleMappingGroup(group.key)} aria-expanded={Boolean(expanded)}>
                <span className={styles.mappingGroupTitle}><span className={styles.mappingGroupIcon}><Icon size={18} /></span><span><strong>{group.label}</strong><small>{group.hint}</small></span></span>
                <span className={styles.mappingGroupCount}>{groupMapped}/{group.fields.length}{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</span>
              </button>
              {expanded && <div className={styles.mappingRows}>
                <div className={styles.mappingColumnHead}><span>App field</span><span>Excel column</span><span>Status</span></div>
                {fields.map(field => {
                  const mapped = data.mapping[field.key] !== undefined && data.mapping[field.key] !== "";
                  const requiredMissing = field.key === "name" && !nameReady;
                  return <div key={field.key} className={styles.mappingRow}>
                    <span className={styles.mappingField}><strong>{field.label}</strong>{field.key === "name" ? <small>Required unless first + last name are mapped</small> : recommendedMappingKeys.has(field.key) ? <small>Recommended</small> : <small>Optional</small>}</span>
                    <select aria-label={`Excel column for ${field.label}`} className={!mapped && requiredMissing ? styles.unmapped : ""} value={data.mapping[field.key] ?? ""} onChange={e => updateMapping(field.key, e.target.value)}><option value="">Ignore / unavailable</option>{(data.grid[data.headerIndex] || []).map((header, index) => <option key={index} value={index}>{String(header || `Column ${index + 1}`)}</option>)}</select>
                    <span className={mapped ? styles.statusMapped : requiredMissing ? styles.statusRequired : styles.statusOptional}>{mapped ? <><Check size={12} /> Mapped</> : requiredMissing ? "Required" : "Optional"}</span>
                  </div>;
                })}
              </div>}
            </article>;
          })}</div>
          <div className={styles.mappingFooter}><button type="button" onClick={autoMap}><Sparkles size={15} /> Auto-map again</button><small>Manual selections remain editable until import starts.</small></div>
          <details className={styles.sourcePreview}><summary>Preview first 5 source rows</summary><div className={styles.table}><table><tbody>{data.grid.slice(data.headerIndex + 1, data.headerIndex + 6).map((row, i) => <tr key={i}>{row.slice(0, 10).map((value, j) => <td key={j}>{String(value ?? "")}</td>)}</tr>)}</tbody></table></div></details>
        </section>;
      })}
      {blocks.length > 0 && <section className={`${styles.card} ${styles.monthsCard}`}>
        <div className={styles.monthsHeader}>
          <div className={styles.monthsTitle}><span><CalendarDays size={21} /></span><div><h2>Attendance months</h2><p>Choose the months you want to import.</p></div></div>
          <div className={styles.monthsHeaderActions}>
            <label className={styles.monthSearch}><Search size={16} /><input value={monthQuery} onChange={e => setMonthQuery(e.target.value)} placeholder="Find month or year" aria-label="Find attendance month or year" /></label>
            <button type="button" onClick={() => changeMonths([])} disabled={!months.length}>Clear all</button>
            <button type="button" className={styles.primary} onClick={() => changeMonths(allowedAttendanceBlocks(sortedAttendanceBlocks).map(block => block.blockId))}>Select all allowed</button>
          </div>
        </div>
        <div className={styles.monthsSummary}>
          <span><strong>{blocks.length}</strong> months found</span>
          <span className={styles.monthsSelected}><CircleCheck size={15} /><strong>{months.length}</strong> selected</span>
          <span>{attendanceYears.length ? `${Math.min(...attendanceYears)}–${Math.max(...attendanceYears)}` : "—"}</span>
          <span className={styles.monthsWarning}><AlertCircle size={15} /> Only attendance marks are imported. Balance and fee labels are not treated as payments.</span>
        </div>
        <div className={styles.monthYearGroups}>
          {recentAttendanceYears.map(year => {
            const allYearBlocks = sortedAttendanceBlocks.filter(block => Number(block.year) === Number(year));
            const allowedYearBlocks = allowedAttendanceBlocks(allYearBlocks);
            const visibleYearBlocks = blocksForYear(year);
            if (normalizedMonthQuery && !visibleYearBlocks.length) return null;
            const selectedCount = allYearBlocks.filter(block => months.includes(block.blockId)).length;
            const allSelected = allowedYearBlocks.length > 0 && selectedCount === allowedYearBlocks.length;
            const expanded = Boolean(normalizedMonthQuery) || expandedMonthGroups.has(String(year));
            return <article key={year} className={styles.monthYearGroup}>
              <div className={styles.monthYearHeader}>
                <button type="button" className={styles.monthExpandButton} onClick={() => toggleMonthGroup(year)} aria-expanded={expanded}>{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>
                <label className={styles.monthYearCheck}><input type="checkbox" checked={allSelected} onChange={() => setMonthGroupSelection(allYearBlocks, !allSelected)} /><strong>{year}</strong></label>
                <span>{selectedCount} of {allYearBlocks.length} selected</span>
              </div>
              {expanded && <div className={styles.monthTiles}>{visibleYearBlocks.map(block => <label key={block.blockId} className={`${styles.monthTile} ${months.includes(block.blockId) ? styles.monthTileSelected : ""}`}>
                <input type="checkbox" checked={months.includes(block.blockId)} disabled={isProtectedReconciliationBlock(block, reconciliationMode)} onChange={() => toggleMonth(block.blockId)} />
                <span><strong>{monthLabels[Number(block.month)] || `Month ${block.month}`}</strong><small>{isProtectedReconciliationBlock(block, reconciliationMode) ? "Protected — not imported" : block.sheetName}</small></span>
              </label>)}</div>}
            </article>;
          })}
          {earlierAttendanceYears.length > 0 && (!normalizedMonthQuery || earlierBlocks.length > 0) && (() => {
            const allEarlierBlocks = sortedAttendanceBlocks.filter(block => earlierAttendanceYears.includes(Number(block.year)));
            const selectedCount = allEarlierBlocks.filter(block => months.includes(block.blockId)).length;
            const allowedEarlierBlocks = allowedAttendanceBlocks(allEarlierBlocks);
            const allSelected = allowedEarlierBlocks.length > 0 && selectedCount === allowedEarlierBlocks.length;
            const expanded = Boolean(normalizedMonthQuery) || expandedMonthGroups.has("earlier");
            return <article className={styles.monthYearGroup}>
              <div className={styles.monthYearHeader}>
                <button type="button" className={styles.monthExpandButton} onClick={() => toggleMonthGroup("earlier")} aria-expanded={expanded}>{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>
                <label className={styles.monthYearCheck}><input type="checkbox" checked={allSelected} onChange={() => setMonthGroupSelection(allEarlierBlocks, !allSelected)} /><strong>Earlier years ({Math.min(...earlierAttendanceYears)}–{Math.max(...earlierAttendanceYears)})</strong></label>
                <span>{selectedCount} of {allEarlierBlocks.length} selected</span>
              </div>
              {expanded && <div className={styles.earlierYears}>{earlierAttendanceYears.map(year => {
                const yearBlocks = blocksForYear(year);
                if (!yearBlocks.length) return null;
                return <div key={year} className={styles.earlierYear}><strong>{year}</strong><div className={styles.monthTiles}>{yearBlocks.map(block => <label key={block.blockId} className={`${styles.monthTile} ${months.includes(block.blockId) ? styles.monthTileSelected : ""}`}><input type="checkbox" checked={months.includes(block.blockId)} disabled={isProtectedReconciliationBlock(block, reconciliationMode)} onChange={() => toggleMonth(block.blockId)} /><span><strong>{monthLabels[Number(block.month)] || `Month ${block.month}`}</strong><small>{isProtectedReconciliationBlock(block, reconciliationMode) ? "Protected — not imported" : block.sheetName}</small></span></label>)}</div></div>;
              })}</div>}
            </article>;
          })()}
        </div>
        {normalizedMonthQuery && !recentAttendanceYears.some(year => blocksForYear(year).length) && !earlierBlocks.length && <p className={styles.emptyMonthSearch}>No attendance month matches “{monthQuery}”.</p>}
      </section>}
      <div className={styles.actions}><button onClick={() => setPhase("setup")}>Back to file & sheets</button><button onClick={saveMappings}>Save mapping profile</button><button className={styles.primary} disabled={!directoryItems.length} onClick={review}>Continue: select & match students</button></div>
    </>}
    {phase === "review" && <>
    <section className={`${styles.card} ${styles.studentScopeCard}`}>
      <div className={styles.studentScopeHeader}><div><h2>Select students to import</h2><p>Import everyone, or open the individual picker to choose specific workbook players.</p></div><strong>{rawSelectedItems.length} of {directoryItems.length} selected</strong></div>
      <div className={styles.scopeChoiceRow}>
        <button type="button" aria-pressed={scope === "all"} onClick={() => { setScope("all"); setPage(0); }}>Import all players</button>
        <button type="button" aria-pressed={scope === "selected"} onClick={() => { setScope("selected"); setPage(0); }}>Choose individual players</button>
      </div>
      {scope === "selected" && <div className={styles.scopePicker}>
        <div className={styles.scopePickerToolbar}>
          <label className={styles.matchSearch}><Search size={16} /><input value={scopeQuery} onChange={e => setScopeQuery(e.target.value)} placeholder="Search workbook players…" aria-label="Search workbook players to select" /></label>
          <button type="button" onClick={() => setSelected(values => [...new Set([...values, ...scopeRows.map(item => item.key)])])}>Select search results</button>
          <button type="button" onClick={() => setSelected(values => values.filter(key => !scopeRows.some(item => item.key === key)))}>Clear search results</button>
        </div>
        <div className={styles.scopePlayerGrid}>{scopeRows.map(item => <label key={item.key} className={selected.includes(item.key) ? styles.scopePlayerSelected : ""}><input type="checkbox" checked={selected.includes(item.key)} onChange={() => toggle(item.key)} /><span><strong>{item.name}</strong><small>{item.phone || item.row.admissionNumber || "No identifier"}</small></span></label>)}</div>
        {!scopeRows.length && <p className={styles.emptyMonthSearch}>No workbook player matches “{scopeQuery}”.</p>}
      </div>}
    </section>
    {duplicateGroups.length > 0 && <section className={styles.card}>
      <div className={styles.decisionHeader}><div><h2>Same-name records need confirmation</h2><p>Confirm whether repeated Excel identities belong to one student or different students. Nothing is merged automatically.</p></div><strong>{duplicateGroups.length} groups</strong></div>
      <div className={styles.scopePlayerGrid}>{duplicateGroups.map(([nameKey, items]) => {
        const choice = duplicateChoices[nameKey];
        return <div key={nameKey} className={choice ? styles.scopePlayerSelected : ""}><span><strong>{items[0].name} · {items.length} Excel identities</strong><small>{items.map((item) => item.phone || item.row.admissionNumber || "No identifier").join(" · ")}</small><small>{choice === "same" ? "Will be merged into one selected student before import." : choice === "different" ? "Will remain separate students." : "Choose Same or Different."}</small></span><div className={styles.actions}><button type="button" onClick={() => { const primary = items.find((item) => item.record) || items.find((item) => item.phone) || items[0]; const linked = items.map((item) => decisions[item.key]).find((value) => value && !value.startsWith("__")); setDuplicateChoices((values) => ({ ...values, [nameKey]: "same" })); setDecisions((values) => { const next = { ...values }; items.forEach((item) => delete next[item.key]); next[primary.key] = linked || "__new__"; return next; }); }}>Same student</button><button type="button" onClick={() => { setDuplicateChoices((values) => ({ ...values, [nameKey]: "different" })); setDecisions((values) => { const next = { ...values }; items.forEach((item) => delete next[item.key]); return next; }); }}>Different students</button></div></div>;
      })}</div>
    </section>}
    <section className={`${styles.card} ${styles.matchingCard} ${styles.decisionCard}`}>
      <div className={styles.decisionHeader}><div><h2>Players requiring your decision</h2><p>Only unmatched, new or conflicting identities appear in this table. Automatically matched players are hidden below.</p></div>{unresolved.length > 0 && <button type="button" className={styles.stageButton} disabled={Boolean(job)} onClick={() => setDecisions(values => ({ ...values, ...Object.fromEntries(unresolved.map(item => [item.key, "__new__"])) }))}>Create all unresolved as new ({unresolved.length})</button>}</div>
      <>
        {!students.length && !resumePlan?._id && <div className={styles.emptyAppNotice} role="status"><strong>Your app has no saved students.</strong><p>Selected Excel players are set to Create new student. No student is saved yet. You can exclude any player; saving starts only after the final Import button.</p></div>}
        <div className={styles.decisionStats}>
          <span><strong>{selectedItems.length}</strong> selected</span><span className={styles.matchStat}><strong>{matchedItems.length}</strong> safely matched</span><span className={styles.reviewStat}><strong>{unresolved.length}</strong> need decision</span><span><strong>{decisionItems.filter(item => category(item.key) === "new").length}</strong> new</span><span><strong>{excludedItems.length}</strong> excluded</span>
        </div>
      </>
      <div className={styles.matchToolbar}>
        <label className={styles.workbookSearch}>Find unmatched player<span className={styles.matchSearch}><Search size={17} aria-hidden="true" /><input aria-label="Search unmatched workbook players" placeholder="Search name, phone or admission…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></span></label>
      </div>
      <div className={`${styles.table} ${styles.matchingTable}`}><table><colgroup><col style={{ width: "22%" }} /><col style={{ width: "34%" }} /><col style={{ width: "12%" }} /><col style={{ width: "32%" }} /></colgroup><thead><tr><th>Player</th><th>Information in Excel</th><th>Attendance cells</th><th>Create new, link or exclude</th></tr></thead><tbody>{rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <tr key={item.key}>
        <td><strong>{item.name}</strong><small>{item.phone || "No phone"}</small></td><td><span className={item.record ? styles.badge : styles.warnBadge}>{item.record ? "Student record found in Excel" : "Only attendance found in Excel"}</span><small>{item.sources.join(", ")}</small><small>{[item.row.schoolName, item.row.beltRank, item.row.dateOfBirth].filter(Boolean).join(" · ")}</small></td><td>{item.attendance.reduce((sum, row) => sum + (row.attendance?.length || 0), 0)}</td>
        <td><small>{!students.length && !resumePlan?._id ? "No saved students in your app" : suggestions[item.key]?.reason}</small><select disabled={Boolean(job)} className={!decisions[item.key] ? styles.unmapped : decisions[item.key] === "__new__" ? styles.newStudentChoice : ""} value={decisions[item.key] || ""} onChange={e => setDecisions(values => ({ ...values, [item.key]: e.target.value }))}>{students.length > 0 && <option value="">Choose: create new or link existing</option>}<option value="__new__">Create new student record</option><option value="__skip__">Exclude this player</option>{[...students].sort((a, b) => studentName(a).trim().localeCompare(studentName(b).trim(), "en", { sensitivity: "base", numeric: true })).map(s => { const owner = linkedOwner(id(s), item.key); const sameNameSource = owner && norm(owner.name) === norm(item.name); const unavailable = Boolean(owner && !sameNameSource && id(s) !== decisions[item.key]); const state = s.status && s.status !== "active" ? ` · ${s.status}` : ""; const usage = owner ? sameNameSource ? " · linked to same-name Excel row" : ` · already linked to ${owner.name}` : ""; return <option key={id(s)} value={id(s)} disabled={unavailable}>{studentName(s)} · {s.phone || s.admissionNumber || "No identifier"}{state}{usage}</option>; })}</select>{decisions[item.key] === "__new__" && <small>{item.record ? "Available mapped Excel details will create a new profile on Import." : "Only available name/details will create an inactive, incomplete profile on Import. Complete it later from Edit Student."}</small>}</td>
      </tr>)}</tbody></table></div>{!rows.length && <div className={styles.allResolved}><CircleCheck size={19} /><div><strong>{decisionItems.length ? "No player matches this search." : "All selected players are resolved."}</strong><p>{decisionItems.length ? "Try another name, phone or admission number." : "Safe matches are available in the optional review panel below."}</p></div></div>}<div className={styles.actions}><button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} / {pages}</span><button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
    </section>
    {matchedItems.length > 0 && <details className={`${styles.card} ${styles.matchedReview}`}><summary><span><CircleCheck size={17} /> Automatically matched players <b>{matchedItems.length}</b></span><small>Optional review</small></summary><p>These identities matched safely by admission number or exact name and phone. Use Change if a match looks wrong.</p><div className={styles.table}><table><thead><tr><th>Excel player</th><th>Matched app student</th><th>Reason</th><th>Action</th></tr></thead><tbody>{matchedItems.map(item => { const existing = students.find(student => id(student) === decisions[item.key]); return <tr key={item.key}><td><strong>{item.name}</strong><small>{item.phone || "No phone"}</small></td><td>{existing ? studentName(existing) : "Saved match"}<small>{existing?.phone || existing?.admissionNumber || ""}</small></td><td>{suggestions[item.key]?.reason || "Previously confirmed match"}</td><td><button type="button" disabled={Boolean(job)} onClick={() => { setDecisions(values => ({ ...values, [item.key]: "" })); setPage(0); }}>Change</button></td></tr>; })}</tbody></table></div></details>}
    {excludedItems.length > 0 && <details className={`${styles.card} ${styles.excludedReview}`}><summary>Excluded players ({excludedItems.length})</summary><div className={styles.scopePlayerGrid}>{excludedItems.map(item => <div key={item.key}><span><strong>{item.name}</strong><small>{item.phone || "No identifier"}</small></span><button type="button" disabled={Boolean(job)} onClick={() => setDecisions(values => ({ ...values, [item.key]: "" }))}>Restore</button></div>)}</div></details>}
    {reconciliationMode && <section className={styles.card}>
      <div className={styles.decisionHeader}><div><h2>Excel recovery audit</h2><p>Compare selected Excel identities and attendance with the app before saving anything.</p></div><button type="button" className={styles.stageButton} disabled={auditBusy || !selectedItems.length} onClick={runRecoveryAudit}>{auditBusy ? "Comparing…" : "Run comparison"}</button></div>
      {!recoveryAudit && <p>This read-only check reports missing student records, completely missing months, partial months, missing cells and conflicts.</p>}
      {recoveryAudit && <>
        <div className={styles.stats}><article><small>Missing student records</small><strong>{recoveryAudit.identity.missing}</strong></article><article><small>Unresolved identities</small><strong>{recoveryAudit.identity.unresolved}</strong></article><article><small>Missing months</small><strong>{recoveryAudit.summary.missingMonths}</strong></article><article><small>Partial months</small><strong>{recoveryAudit.summary.partialMonths}</strong></article><article><small>Missing cells</small><strong>{recoveryAudit.summary.missingCells}</strong></article><article><small>Conflicts protected</small><strong>{recoveryAudit.summary.conflicts}</strong></article></div>
        <div className={styles.table}><table><thead><tr><th>Student</th><th>Excel month</th><th>App status</th><th>Excel/App cells</th><th>Missing dates</th><th>Conflicts</th></tr></thead><tbody>{recoveryAudit.rows.filter((row) => row.missingCells || row.conflicts.length || row.metadataMissing || row.matchStatus !== "matched").slice(0, 500).map((row, index) => <tr key={`${row.rowKey}:${index}`}><td><strong>{row.name}</strong><small>{row.student?.name || "No linked app student"}</small></td><td>{row.month && row.year ? `${monthLabels[row.month]} ${row.year}` : row.sourceSheet}</td><td>{row.matchStatus === "matched" ? row.missingCells === 0 ? "Complete" : row.existingCells === 0 ? "Month missing" : "Partially missing" : "Student missing / unresolved"}{row.metadataMissing ? " · metadata missing" : ""}</td><td>{row.excelCells} / {row.existingCells}</td><td>{row.missingDates.slice(0, 8).join(", ")}{row.missingDates.length > 8 ? ` +${row.missingDates.length - 8}` : ""}</td><td>{row.conflicts.length}</td></tr>)}</tbody></table></div>
        {!recoveryAudit.rows.some((row) => row.missingCells || row.conflicts.length || row.metadataMissing || row.matchStatus !== "matched") && <div className={styles.allResolved}><CircleCheck size={19} /><div><strong>No missing attendance found.</strong><p>Selected Excel attendance is already present in the app.</p></div></div>}
        <p>Final import uses “skip existing”: saved attendance remains unchanged; only missing selected records, cells and blank imported metadata are added.</p>
      </>}
    </section>}
    <details className={`${styles.card} ${styles.advancedImport}`}><summary>Advanced import settings</summary><p>Defaults protect existing profiles and attendance. Change these only when you intentionally want to update saved students.</p><div className={styles.matchFilters}>
      <label>What should be imported?<select value={importTarget} disabled={Boolean(job) || reconciliationMode} onChange={e => { setImportTarget(e.target.value); if (e.target.value === "all") { setPolicy("overwrite"); setDuplicateMode("overwrite"); } else { setPolicy("keep"); setDuplicateMode("skip"); } }}><option value="new">Only new students + their selected attendance</option><option value="all">New + existing students (update selected data)</option></select></label>
      <label>Existing profile policy<select value={policy} onChange={e => setPolicy(e.target.value)} disabled={Boolean(job) || mode === "attendance" || importTarget === "new" || reconciliationMode}><option value="fill-empty">Fill blank supported fields only</option><option value="keep">Keep existing profile unchanged</option><option value="review">Review and select individual fields</option><option value="overwrite">Replace supported fields supplied in Excel</option></select></label>
      <label>Existing attendance<select value={duplicateMode} onChange={e => setDuplicateMode(e.target.value)} disabled={Boolean(job) || reconciliationMode}><option value="skip">Skip existing marks (fill missing metadata)</option><option value="overwrite">Replace marks and imported metadata</option></select></label>
    </div><p className={styles.matchHelp}>{importTarget === "new" ? "Only new identities will be imported. Existing students and their attendance will not be changed." : "Selected existing profiles and attendance may be updated according to these policies. Blank Excel fields do not erase saved data."}</p></details>
    </>}
    {phase === "review" && policy === "review" && mode !== "attendance" && <section className={styles.card}><h2>Review profile changes</h2><p>Only checked fields will be replaced. Names/admission identifiers are never changed here. Medical arrays and other hidden fields should be reviewed in Edit Student.</p>{matchedItems.map(item => { const existing = students.find(s => id(s) === decisions[item.key]); if (!existing) return null; const fields = reviewFields.filter(field => field !== "medicalConditions" && item.row[field] !== undefined && String(item.row[field]).trim() && !/^[—–-]+$/.test(String(item.row[field]).trim())); return <details key={item.key}><summary>{item.name} → {studentName(existing)} ({overrides[item.key]?.length || 0} fields selected)</summary><div className={styles.table}><table><thead><tr><th>Replace</th><th>Field</th><th>Existing</th><th>Excel</th></tr></thead><tbody>{fields.map(field => <tr key={field}><td><input type="checkbox" disabled={Boolean(job)} checked={overrides[item.key]?.includes(field) || false} onChange={() => setOverrides(values => { const current = values[item.key] || []; return { ...values, [item.key]: current.includes(field) ? current.filter(value => value !== field) : [...current, field] }; })} /></td><td>{field}</td><td>{String(existing[field] ?? "Empty")}</td><td>{String(item.row[field])}</td></tr>)}</tbody></table></div></details>; })}</section>}
    {phase === "confirm" && <section className={styles.card}><h2>{importTarget === "new" ? "Only NEW students will be imported" : "New + existing students will be processed"}</h2><p>{importTarget === "new" ? "Existing students and ALL their attendance are excluded from this run. No existing data will be overwritten." : `Existing profiles: ${mode === "attendance" ? "unchanged" : policy}. Existing attendance: ${duplicateMode}. Only supplied supported Excel data is updated; this is not a database reset.`}</p></section>}
    {warnings.length > 0 && <details className={styles.card}><summary>Parsing warnings ({warnings.length})</summary>{warnings.map((warning, index) => <p key={index}>{warning}</p>)}</details>}
    {phase === "review" && <div className={styles.actions}><button disabled={Boolean(job)} onClick={() => setPhase("mapping")}>Back to Excel columns</button><button onClick={saveDraft}>Save browser draft</button><button className={styles.primary} disabled={!included.length} onClick={() => setPhase("confirm")}>Continue: review & import</button></div>}
    {phase === "confirm" && <section className={styles.card}><h2>Review before saving</h2><div className={styles.stats}><article><small>New students to create</small><strong>{included.filter(item => decisions[item.key] === "__new__").length}</strong></article><article><small>Link to existing students</small><strong>{included.filter(item => decisions[item.key] !== "__new__").length}</strong></article><article><small>Still need a choice</small><strong>{unresolved.length}</strong></article><article><small>Excluded from import</small><strong>{selectedItems.filter(item => decisions[item.key] === "__skip__").length}</strong></article></div><p>Import: {({students:"Student records",attendance:"Attendance",both:"Records + attendance"})[mode]}. Destination: {batchOptions.find(item => id(item) === batch)?.batchName}. Attendance is imported only for identities whose student step succeeds.</p><div className={styles.actions}><button onClick={() => setPhase("review")}>Back to student matching</button><button onClick={saveDraft}>Save browser draft</button><button className={styles.primary} disabled={!included.length || Boolean(unresolved.length)} onClick={() => execute(false)}>Import selected records / attendance</button>{unresolved.length > 0 && <button disabled={!included.length} onClick={() => execute(true)}>Import ready students only — skip pending</button>}</div></section>}
    {phase === "result" && result && <section className={styles.card}><h2>Import result</h2><div className={styles.stats}>{Object.entries(result).filter(([key]) => key !== "errors").map(([key, value]) => <article key={key}><small>{key}</small><strong>{value}</strong></article>)}</div><p>Counts describe confirmed API responses. Review failed rows before assuming every selected player was imported. Attendance metadata is not a fee receipt.</p><div className={styles.actions}><Link to="/students">View students</Link><Link to={`/attendance?batch=${batch}`}>View attendance</Link><Link to={`/imports/fee-reconciliation${batch ? `?batch=${batch}` : ""}`}>Review imported fee data</Link><button onClick={downloadErrors}>Download errors CSV</button><button onClick={() => setPhase("review")}>Review / resume this import</button><button onClick={reset}>Start another import</button></div>{result.errors.slice(0, 100).map((e, i) => <p key={i}>{e.stage} · Row {e.rowNumber || ""}: {e.message}</p>)}</section>}
    <section className={styles.card}><h2><History size={19} /> My import history</h2><p>Latest 50 imports for your account in this academy. To resume on another device, choose the same original file. Browser drafts stay on this device.</p><div className={styles.table}><table><thead><tr><th>Workbook</th><th>Mode</th><th>Status</th><th>Started</th><th>Action</th></tr></thead><tbody>{sessions.map(session => <tr key={session._id}><td>{session.fileName}</td><td>{session.mode}</td><td>{session.status}</td><td>{new Date(session.createdAt).toLocaleString()}</td><td><div className={styles.actions}><button onClick={async () => { try { setHistoryDetail(unwrap(await api.get(`/import-sessions/${session._id}`))); } catch(e) { setError(errorText(e)); } }}>Details</button><button onClick={() => selectSession(session)}>Resume</button></div></td></tr>)}</tbody></table></div>
    {historyDetail && <div><h3>{historyDetail.fileName}</h3><div className={styles.stats}>{Object.entries(journalSummary(historyDetail.chunks)).map(([key, value]) => <article key={key}><small>{key}</small><strong>{value}</strong></article>)}</div><p>Uncertain chunks must be checked before retrying. A failed API response may contain earlier saved data; do not assume rollback.</p><div className={styles.table}><table><thead><tr><th>Chunk</th><th>Status</th><th>Result</th></tr></thead><tbody>{historyDetail.chunks?.map(chunk => <tr key={chunk._id}><td>{chunk.key}</td><td>{chunk.status}</td><td>{chunk.response?.message || "Waiting / uncertain"}</td></tr>)}</tbody></table></div><button onClick={() => setHistoryDetail(null)}>Close details</button></div>}
    </section>
    </fieldset>
  </div>;
}
