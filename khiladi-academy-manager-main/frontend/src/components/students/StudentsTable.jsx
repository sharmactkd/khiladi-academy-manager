import { Link, useNavigate } from "react-router-dom";
import { Edit3, Trash2, UsersRound } from "lucide-react";
import { getStudentAgeCategoryDisplay } from "../../utils/studentAgeCategory.js";
import { formatStudentPhone } from "../../utils/studentPhone.js";
import "./StudentsTable.module.css";

const getStudentFullName = (student) => student.name || [student.firstName, student.lastName].filter(Boolean).join(" ");
const displayBelt = (student) => student.beltRank === "Black" && student.danRank ? `Black (${student.danRank})` : student.beltRank || "-";

export default function StudentsTable({
  students = [], loading = false, loadingMore = false,
  pagination = { total: students.length, hasNextPage: false },
  selectable = false, selectedIds = [], allVisibleSelected = false,
  toggleSelectAll, toggleSelectOne, handleBulkDelete, bulkDeleting = false,
  handleStudentsScroll, handleStatusToggle, handleDelete, statusUpdatingIds = [],
}) {
  const navigate = useNavigate();
  const visibleStudents = students;
  return (
      <section className="students-table-card shared-students-table">
        {selectedIds.length > 0 ? <div className="students-table-toolbar students-table-toolbar--selection"><div><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /><span>{selectedIds.length} selected</span><button type="button" onClick={handleBulkDelete} disabled={bulkDeleting}><Trash2 size={15} />{bulkDeleting ? "Deleting…" : "Delete Selected"}</button></div></div> : null}
        {loading ? <div className="students-state"><span /> Loading students…</div> : students.length === 0 ? <div className="students-state"><UsersRound size={31} /><strong>No students found</strong><p>Try changing your filters or add a new student.</p></div> : <div className="students-table-wrap" onScroll={handleStudentsScroll}><table className="students-table">
          <thead><tr>{selectable && <th><input type="checkbox" aria-label="Select all visible students" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>}<th>Student</th><th>Age / Category</th><th>Contact</th><th>School / Class</th><th>Batch</th><th>Martial Art</th><th>Belt</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visibleStudents.map((student) => {
            const fullName = getStudentFullName(student);
            const selected = selectedIds.includes(student._id);
            return <tr key={student._id} className={selected ? "is-selected" : ""} tabIndex={0} aria-label={`View ${fullName || "student"} details`} onClick={() => navigate(`/students/${student._id}`)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); navigate(`/students/${student._id}`); } }}>
              {selectable && <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${fullName}`} checked={selected} onChange={() => toggleSelectOne(student._id)} /></td>}
              <td><div className="students-person"><strong>{fullName || "Unnamed Student"}</strong></div></td>
              <td><strong>{student.age ?? "—"}</strong><small>{getStudentAgeCategoryDisplay(student) || "Not added"}</small></td>
              <td><strong>{formatStudentPhone(student.phone, student.countryCode) || "—"}</strong><small>{student.email || "Not added"}</small></td>
              <td><strong>{student.schoolName || student.education?.schoolName || "—"}</strong><small>{[student.className, student.section].filter(Boolean).join(" - ") || "Not added"}</small></td>
              <td><strong>{student.batch?.batchName || "—"}</strong></td><td><strong>{student.martialArt || "—"}</strong></td><td><strong>{displayBelt(student)}</strong></td>
              <td onClick={(event) => event.stopPropagation()}>{["active", "inactive"].includes(student.status) ? <button type="button" className={`students-status is-${student.status}`} onClick={() => handleStatusToggle(student)} disabled={statusUpdatingIds.includes(student._id)}><i><span /></i>{statusUpdatingIds.includes(student._id) ? "Saving…" : student.status}</button> : <span className="students-left-status">{student.status || "—"}</span>}</td>
              <td onClick={(event) => event.stopPropagation()}><div className="students-row-actions"><Link to={`/students/${student._id}/edit`} title="Edit student" aria-label={`Edit ${fullName || "student"}`}><Edit3 size={16} /></Link><button type="button" className="students-row-actions__delete" title="Delete student" aria-label={`Delete ${fullName || "student"}`} onClick={() => handleDelete(student)}><Trash2 size={16} /></button></div></td>
            </tr>;
          })}</tbody>
        </table></div>}
        {!loading && students.length > 0 ? <footer className="students-list-footer"><span>Showing {visibleStudents.length} of {pagination.total} students</span>{loadingMore ? <span>Loading more students…</span> : pagination.hasNextPage ? <span>Scroll down to load more students</span> : <strong>All students loaded</strong>}</footer> : null}
      </section>
  );
}
