import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { UserPlus, ArrowRight } from "lucide-react";
import { getAttendanceUnmatchedHistory } from "../../utils/attendanceReviewGroups.js";
import { attendanceStudentChoices, linkedAttendanceStudentIds } from "../../utils/attendanceStudentChoices.js";
import styles from "./AttendanceImportModal.module.css";

function MatchSection({ title, groups, students, options, linkedIds, onResolve, busy, historyMode = false }) {
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
          const currentValue = group.excluded ? "__skip__" : group.studentId || "__create__";
          const choices = attendanceStudentChoices({ options, candidates: group.candidates,
            selectedStudent: student, selectedId: group.studentId, linkedIds });
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
                if (linkedIds.has(value) && value !== String(group.studentId)) return;
                onResolve(group, value === "__create__" ? "" : value);
                setEditingKey(null);
              }}
              onBlur={() => { if (editingKey === group.groupKey) setEditingKey(null); }}
              onKeyDown={(event) => { if (event.key === "Escape") setEditingKey(null); }}>
              <option value="__create__">Create new student</option>
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

export default function AttendanceMatchSections({ groups, historyGroups, availableStudents, onResolve, onCreateAll, busy }) {
  const [bulkResult, setBulkResult] = useState(null);
  const bulkFlight = useRef(false);
  const createAll = async () => {
    const count = groups.filter((group) => !group.studentId && !group.excluded).length;
    if (busy || bulkFlight.current || !count) return;
    bulkFlight.current = true;
    try {
      const result = await onCreateAll();
      if (result) setBulkResult(result);
    } catch (failure) {
      setBulkResult({ created: 0, remaining: count, error: failure.message });
    } finally { bulkFlight.current = false; }
  };
  const [activeTab, setActiveTab] = useState("matched");
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const linkedIds = useMemo(() => linkedAttendanceStudentIds(groups), [groups]);
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
  const options = useMemo(() => availableStudents.filter((student) => !linkedIds.has(String(student._id)) &&
    `${student.name} ${student.phone} ${student.admissionNumber}`.toLowerCase().includes(studentSearch.toLowerCase())
  ), [availableStudents, studentSearch, linkedIds]);
  return <>
    <div className={styles.matchTabs} role="group" aria-label="Student matching lists">
      <button type="button" aria-pressed={activeTab === "matched"} onClick={() => setActiveTab("matched")}>Matched ({groups.filter((group) => group.studentId).length})</button>
      <button type="button" aria-pressed={activeTab === "unmatched"} onClick={() => setActiveTab("unmatched")}>Unmatched history ({allHistory.length}) · Pending ({groups.filter((group) => !group.studentId && !group.excluded).length})</button>
    </div>
    {activeTab === "unmatched" && <section className={styles.createQueue} aria-label="Students queued for creation">
      <header><span><UserPlus size={20} aria-hidden="true" /></span><div><strong>Create student records</strong><small>Unmatched students default to Create new student. Selecting an existing student or Exclude removes them from this queue.</small></div><b>{groups.filter((group) => !group.studentId && !group.excluded).length} queued</b></header>
      <div className={styles.createQueueNames}>{groups.filter((group) => !group.studentId && !group.excluded).slice(0, 12).map((group) => <span key={group.groupKey}>{group.name || "Unnamed student"}</span>)}{groups.filter((group) => !group.studentId && !group.excluded).length > 12 && <span>+{groups.filter((group) => !group.studentId && !group.excluded).length - 12} more</span>}</div>
      <footer><small>Records are created as inactive, incomplete profiles. Attendance imports separately after linking.</small><button type="button" className={styles.primary} disabled={busy || !groups.some((group) => !group.studentId && !group.excluded)} onClick={createAll}>{busy ? "Creating & linking…" : "Create & link students"}<ArrowRight size={16} aria-hidden="true" /></button></footer>
    </section>}
    {bulkResult && <div className={styles.reviewNotice} role="status">
      <span>{bulkResult.created} records created and linked · {bulkResult.remaining} remaining.
        {bulkResult.error && ` Stopped: ${bulkResult.error} Check Student Records before retrying; earlier successes are already saved.`}
      </span><button type="button" onClick={() => setActiveTab("matched")}>Review created matches</button>
    </div>}
    <div className={styles.reviewControls}>
      <label>Find Excel student <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone or sheet" /></label>
      <label>Find existing student <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Name, phone or admission" /></label>
      <small>Repeated identical Excel identities are grouped, not automatically verified. A selection applies to all rows in that group. Check carefully when different students share the same name.</small>
      <small>Only unlinked students are available. Selecting a student removes them from other rows; changing or excluding their match makes them available again.</small>
    </div>
    <MatchSection key={`${activeTab}:${search}`} title={activeTab === "matched" ? "Matched students" : "Unmatched students · matched rows remain as faded history"} groups={activeTab === "matched" ? filtered.filter((group) => group.studentId) : unmatchedHistory} students={students} options={options} linkedIds={linkedIds} onResolve={onResolve} busy={busy} historyMode={activeTab === "unmatched"} />
  </>;
}
