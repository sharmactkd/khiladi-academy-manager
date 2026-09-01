import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { UserPlus, Info, ArrowRight } from "lucide-react";
import { getAttendanceUnmatchedHistory } from "../../utils/attendanceReviewGroups.js";
import styles from "./AttendanceImportModal.module.css";

function MatchSection({ title, groups, students, options, onResolve, onCreate, busy, historyMode = false }) {
  const [page, setPage] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const editingSelectRef = useRef(null);
  const editMatch = (group) => {
    if (busy || !historyMode) return;
    flushSync(() => setEditingKey(group.groupKey));
    editingSelectRef.current?.focus();
    // Open supported native pickers within the user's double-click gesture.
    try { editingSelectRef.current?.showPicker?.(); } catch { /* Focused select remains usable. */ }
  };
  const editWithKeyboard = (event, group) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      editMatch(group);
    }
  };
  const pages = Math.max(1, Math.ceil(groups.length / 25));
  const current = Math.min(page, pages - 1);
  return <section className={styles.panel}>
    <div className={styles.panelHeading}><strong>{title} ({groups.length})</strong></div>
    {!groups.length ? <p className={styles.selectionNote}>No students in this list.</p> : <>
      <div className={styles.reviewTableWrap}><table className={styles.reviewTable}>
        <thead><tr><th>Excel student</th><th>Detected identity</th><th>Match result</th><th>Confirm student</th></tr></thead>
        <tbody>{groups.slice(current * 25, (current + 1) * 25).map((group) => {
          const student = students.get(group.studentId) || group.student;
          const currentValue = group.excluded ? "__skip__" : group.studentId || "";
          const choices = [...new Map([
            ...(student ? [student] : []), ...options, ...group.candidates,
          ].map((item) => [item._id, item])).values()].slice(0, 60);
          return <tr key={group.groupKey} className={historyMode && group.isMatchHistory ? styles.matchedShadowRow : group.studentId || group.excluded ? "" : styles.unresolvedRow}>
            <td><strong>{group.name || "Unnamed row"}</strong>
              <small>{group.rowKeys.length} Excel rows · {group.attendanceCells} cells</small>
              <small title={group.sources.map((source) => `${source.sheet}: row ${source.row}`).join(", ")}>Repeated entries grouped; original attendance retained.</small>
            </td>
            <td>{group.phone || "No phone"}<small>{group.admissionNumber || "No admission/code"}</small></td>
            <td>{group.studentId ? <><span className={styles.matchOk} onDoubleClick={() => editMatch(group)} title={historyMode ? "Double-click the green name to change this match" : undefined}>{historyMode ? "Matched with " : ""}{student?.name || "Confirmed student"}</span>{historyMode && <small>Moved to Matched students · double-click to change</small>}</> : group.excluded ? <span className={styles.excluded}>Excluded</span> : <span className={styles.matchError}>Review · {group.reason}</span>}</td>
            <td>{historyMode && group.isMatchHistory && editingKey !== group.groupKey ? <span className={`${styles.shadowMatchLabel} ${styles.editableMatch}`} role="button" tabIndex={busy ? -1 : 0} aria-disabled={busy} aria-label={`Change match for ${group.name}`} title="Double-click to change match (keyboard: Enter)" onDoubleClick={() => editMatch(group)} onKeyDown={(event) => editWithKeyboard(event, group)}>{group.excluded ? "Excluded from import" : `${student?.name || "Confirmed student"} · ${student?.phone || student?.admissionNumber || "No identifier"}`}</span> : <><select aria-label={`Confirm student for ${group.name}`} disabled={busy}
              ref={editingKey === group.groupKey ? editingSelectRef : undefined}
              value={currentValue}
              className={!group.studentId && !group.excluded ? styles.invalidSelect : ""}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "__create__") {
                  event.target.value = currentValue;
                  onCreate(group);
                } else {
                  onResolve(group, value);
                }
                setEditingKey(null);
              }}
              onBlur={() => { if (editingKey === group.groupKey) setEditingKey(null); }}
              onKeyDown={(event) => { if (event.key === "Escape") setEditingKey(null); }}>
              <option value="__create__">Create student record</option>
              <option value="" disabled hidden>Select existing student</option>
              {choices.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.phone || item.admissionNumber || "No identifier"}</option>)}
              <option value="__skip__">Exclude these Excel rows</option>
            </select>
            </>}</td>
          </tr>;
        })}</tbody>
      </table></div>
      <div className={styles.reviewControls}>
        <button type="button" disabled={!current || busy} onClick={() => setPage(current - 1)}>Previous</button>
        <span>Page {current + 1} of {pages} · 25 students per page</span>
        <button type="button" disabled={current + 1 >= pages || busy} onClick={() => setPage(current + 1)}>Next</button>
      </div>
    </>}
  </section>;
}

export default function AttendanceMatchSections({ groups, historyGroups, availableStudents, onResolve, onCreate, onCreateAll, busy }) {
  const [bulkResult, setBulkResult] = useState(null);
  const bulkFlight = useRef(false);
  const createAll = async () => {
    const count = groups.filter((group) => !group.studentId && !group.excluded).length;
    if (busy || bulkFlight.current || !count) return;
    if (!window.confirm(`Create ${count} NEW inactive student records for ALL currently unresolved groups (including those hidden by search)? Records may duplicate existing students and remain saved if import is cancelled. After attendance is imported, changing a name does NOT merge it into an old record. Continue?`)) return;
    bulkFlight.current = true;
    try {
      const result = await onCreateAll();
      if (result) setBulkResult(result);
    } catch (failure) {
      setBulkResult({ created: 0, remaining: count, error: failure.message });
    } finally { bulkFlight.current = false; }
  };
  const [activeTab, setActiveTab] = useState("matched");
  const [creatingGroup, setCreatingGroup] = useState(null);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", status: "inactive" });
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const createPanelRef = useRef(null);
  useEffect(() => {
    if (creatingGroup) {
      createPanelRef.current?.scrollIntoView({ block: "nearest" });
      createPanelRef.current?.querySelector('input')?.focus({ preventScroll: true });
    }
  }, [creatingGroup]);
  const openCreate = (group) => {
    const [firstName = "", ...rest] = String(group.sources[0]?.name || group.name || "").trim().split(/\s+/);
    setDraft({ firstName, lastName: rest.join(" "), status: "inactive" });
    setError(""); setCreatingGroup(group);
  };
  const saveRecord = async () => {
    if (inFlight.current || busy || !draft.firstName.trim()) return;
    inFlight.current = true; setError("");
    try {
      await onCreate(creatingGroup, draft);
      setCreatingGroup(null); setActiveTab("unmatched");
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || "Could not confirm creation. Check Student Records before retrying.");
    } finally { inFlight.current = false; }
  };
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const students = useMemo(() => new Map(availableStudents.map((student) => [student._id, student])), [availableStudents]);
  const filtered = useMemo(() => groups.filter((group) =>
    `${group.name} ${group.phone} ${group.admissionNumber} ${group.sources.map((source) => source.sheet).join(" ")}`.toLowerCase().includes(search.toLowerCase())
  ), [groups, search]);
  const allHistory = useMemo(() => {
    const source = historyGroups || getAttendanceUnmatchedHistory(groups);
    const covered = new Set(source.flatMap((group) => group.rowKeys));
    return [...source, ...groups.filter((group) => !group.studentId && group.rowKeys.every((key) => !covered.has(key)))];
  }, [groups, historyGroups]);
  const unmatchedHistory = useMemo(() => allHistory.filter((group) =>
    `${group.name} ${group.phone} ${group.admissionNumber} ${group.sources.map((source) => source.sheet).join(" ")}`.toLowerCase().includes(search.toLowerCase())
  ), [allHistory, search]);
  const options = useMemo(() => availableStudents.filter((student) =>
    `${student.name} ${student.phone} ${student.admissionNumber}`.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 50), [availableStudents, studentSearch]);
  return <>
    <div className={styles.matchTabs} role="group" aria-label="Student matching lists">
      <button type="button" aria-pressed={activeTab === "matched"} onClick={() => setActiveTab("matched")}>Matched ({groups.filter((group) => group.studentId).length})</button>
      <button type="button" aria-pressed={activeTab === "unmatched"} onClick={() => setActiveTab("unmatched")}>Unmatched history ({allHistory.length}) · Pending ({groups.filter((group) => !group.studentId && !group.excluded).length})</button>
    </div>
    {activeTab === "unmatched" && <div className={styles.reviewControls}>
      <button type="button" disabled={busy || !groups.some((group) => !group.studentId && !group.excluded)} onClick={createAll}>Create records for all unmatched ({groups.filter((group) => !group.studentId && !group.excluded).length})</button>
      <small>Creates inactive, incomplete profiles. Excluded groups are not created. You can edit profiles later, or change their match before importing attendance.</small>
    </div>}
    {bulkResult && <div className={styles.reviewNotice} role="status">
      <span>{bulkResult.created} records created and linked · {bulkResult.remaining} remaining.
        {bulkResult.error && ` Stopped: ${bulkResult.error} Check Student Records before retrying; earlier successes are already saved.`}
      </span><button type="button" onClick={() => setActiveTab("matched")}>Review created matches</button>
    </div>}
    {creatingGroup && <section ref={createPanelRef} className={styles.createRecordPanel} aria-label="Create student record">
      <header className={styles.createRecordHeader}>
        <span className={styles.createRecordIcon}><UserPlus size={22} aria-hidden="true" /></span>
        <div><span className={styles.createRecordEyebrow}>NEW STUDENT</span><h3>Create student record</h3><p>Add the student to this batch and link their Excel entries.</p></div>
        <span className={styles.createRecordCount}>{creatingGroup.rowKeys.length} Excel rows</span>
      </header>
      <div className={styles.createRecordFields}>
        <label><span>First name <b>*</b></span><input required maxLength={100} autoComplete="off" value={draft.firstName} placeholder="Enter first name" disabled={busy} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} /></label>
        <label><span>Last name <small>Optional</small></span><input maxLength={100} autoComplete="off" value={draft.lastName} placeholder="Enter last name" disabled={busy} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} /></label>
        <label><span>Student status</span><select value={draft.status} disabled={busy} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="inactive">Inactive (historical student)</option><option value="active">Active</option></select></label>
      </div>
      <div className={styles.createRecordInfo}><Info size={18} aria-hidden="true" /><p>Admission number is generated automatically. Add DOB and contact details later from Edit Student. Attendance is saved only when you import.</p></div>
      {error && <p role="alert" className={styles.createRecordError}>{error}</p>}
      <footer className={styles.createRecordFooter}>
        <small>The student record stays saved even if you cancel this import.</small>
        <div className={styles.createRecordActions}>
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => setCreatingGroup(null)}>Cancel</button>
          <button type="button" className={styles.primary} disabled={busy || !draft.firstName.trim()} onClick={saveRecord}>{busy ? "Creating…" : "Create & link student"}<ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </footer>
    </section>}
    <div className={styles.reviewControls}>
      <label>Find Excel student <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone or sheet" /></label>
      <label>Find existing student <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Name, phone or admission" /></label>
      <small>Repeated identical Excel identities are grouped, not automatically verified. A selection applies to all rows in that group. Check carefully when different students share the same name.</small>
      <small>Student choices show up to 50 search results. Search to find another student.</small>
    </div>
    <MatchSection key={`${activeTab}:${search}`} title={activeTab === "matched" ? "Matched students" : "Unmatched students · matched rows remain as faded history"} groups={activeTab === "matched" ? filtered.filter((group) => group.studentId) : unmatchedHistory} students={students} options={options} onResolve={onResolve} onCreate={openCreate} busy={busy} historyMode={activeTab === "unmatched"} />
  </>;
}
