import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronDown, Download, Edit3,
  FileText, Filter, Printer, Search, Trash2, Upload,
  UserCheck, UserPlus, UsersRound, UserX, X,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";
import { getBranches } from "../../api/branchApi.js";
import { academyApi } from "../../api/academyApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import StudentImportModal from "../../components/students/StudentImportModal.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import { printDataTable } from "../../utils/securePrint.js";
import "./Students.module.css";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AGE_CATEGORIES = ["", "Sub-Junior", "Cadet", "Junior", "Senior"];

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN");
};

const getStudentFullName = (student) => {
  return (
    student.name ||
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    ""
  );
};

const displayBelt = (student) => {
  const belt = student.beltRank || "-";

  if (belt === "Black" && student.danRank) {
    return `${belt} (${student.danRank})`;
  }

  return belt;
};

const Students = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState([]);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const LOAD_STEP = 20;

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    batch: "",
    martialArt: "",
    beltRank: "",
    ageCategory: "",
    bloodGroup: "",
  });

  const allVisibleSelected = useMemo(() => {
    return (
      students.length > 0 &&
      students.every((student) => selectedIds.includes(student._id))
    );
  }, [students, selectedIds]);

  const selectedStudents = useMemo(() => {
    return students.filter((student) => selectedIds.includes(student._id));
  }, [students, selectedIds]);

  const printableStudents = useMemo(() => {
    return selectedStudents.length > 0 ? selectedStudents : students;
  }, [selectedStudents, students]);

  const visibleStudents = useMemo(() => {
    return students.slice(0, visibleCount);
  }, [students, visibleCount]);

  const activeCount = useMemo(
    () => students.filter((student) => student.status === "active").length,
    [students]
  );
  const incompleteCount = useMemo(
    () => students.filter((student) => student.profileStatus === "incomplete").length,
    [students]
  );
  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    return students.filter((student) => {
      const created = new Date(student.createdAt || student.joiningDate || "");
      return !Number.isNaN(created.getTime()) &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear();
    }).length;
  }, [students]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => String(value || "").trim()).length,
    [filters]
  );

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          String(value || "").trim()
        )
      );

      const response = await studentApi.getAll(cleanFilters);
      const list = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];

      setStudents(Array.isArray(list) ? list : []);
      setSelectedIds([]);
      setVisibleCount(LOAD_STEP);
    } catch (error) {
      toast.error(error.response?.data?.message || "Students load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (student) => {
    if (!student?._id || !["active", "inactive"].includes(student.status)) {
      return;
    }

    const nextStatus = student.status === "active" ? "inactive" : "active";
    const previousStatus = student.status;

    setStatusUpdatingIds((current) => [...current, student._id]);
    setStudents((current) =>
      current.map((item) =>
        item._id === student._id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await studentApi.updateStatus(student._id, nextStatus);
      toast.success(`Student marked ${nextStatus}`);
    } catch (error) {
      setStudents((current) =>
        current.map((item) =>
          item._id === student._id
            ? { ...item, status: previousStatus }
            : item
        )
      );
      toast.error(
        error.response?.data?.message || "Student status update failed"
      );
    } finally {
      setStatusUpdatingIds((current) =>
        current.filter((id) => id !== student._id)
      );
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await getBranches({ status: "active" });
      const list = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || response?.data || [];

      setBranches(Array.isArray(list) ? list : []);
    } catch {
      setBranches([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await batchApi.getAll();

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setBatches(list.filter((batch) => batch.isActive));
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchBatches();
    academyApi.getMyAcademy()
      .then((response) => setAcademy(response?.data?.data?.academy || response?.data?.academy || null))
      .catch(() => setAcademy(null));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((student) => student._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  };

  const handleStudentsScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;

    if (scrollHeight - scrollTop - clientHeight > 180) return;

    setVisibleCount((current) =>
      Math.min(current + LOAD_STEP, students.length)
    );
  };

  const buildExportRows = (list) => {
    return list.map((student, index) => ({
      "S. No.": index + 1,
      "Student Code": student.studentCode || student.admissionNumber || "",
      "Admission Number": student.admissionNumber || "",
      Name: getStudentFullName(student),
      Gender: student.gender || "",
      DOB: formatDate(student.dateOfBirth),
      Age: student.age ?? "",
      "Age Category": student.ageCategory || "",
      Phone: student.phone || "",
      Email: student.email || "",
      "Blood Group": student.bloodGroup || "",
      School: student.schoolName || student.education?.schoolName || "",
      Class: student.className || student.education?.className || "",
      Section: student.section || student.education?.section || "",
      College: student.collegeName || student.education?.collegeName || "",
      Occupation: student.occupation || student.education?.occupation || "",
      "Parent Name": student.parentName || "",
      "Parent Phone": student.parentPhone || "",
      Branch: student.branch?.branchName || "",
      Batch: student.batch?.batchName || "",
      "Martial Art": student.martialArt || "",
      "Belt Rank": displayBelt(student),
      Height: student.heightCm ?? student.physicalInfo?.heightCm ?? "",
      Weight: student.weightKg ?? student.physicalInfo?.weightKg ?? "",
      Status: student.status || "",
      City: student.city || "",
      State: student.state || "",
      Address: student.address || "",
      "Emergency Contact Name": student.emergencyContact?.name || "",
      "Emergency Contact Phone": student.emergencyContact?.phone || "",
      Notes: student.notes || "",
    }));
  };

  const buildCompactRows = (list) => {
    return list.map((student, index) => [
      index + 1,
      student.studentCode || student.admissionNumber || "",
      getStudentFullName(student),
      student.age ?? "",
      student.ageCategory || "",
      student.phone || "",
      student.batch?.batchName || "",
      student.martialArt || "",
      displayBelt(student),
      student.status || "",
    ]);
  };

  const handleExportExcel = () => {
    const exportList = printableStudents;

    if (exportList.length === 0) {
      toast.error("Export ke liye koi student nahi mila");
      return;
    }

    const rows = buildExportRows(exportList);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 26 },
      { wch: 12 },
      { wch: 14 },
      { wch: 8 },
      { wch: 14 },
      { wch: 15 },
      { wch: 26 },
      { wch: 14 },
      { wch: 28 },
      { wch: 10 },
      { wch: 10 },
      { wch: 28 },
      { wch: 20 },
      { wch: 24 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 35 },
      { wch: 26 },
      { wch: 22 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const today = new Date().toISOString().slice(0, 10);
    const fileName =
      selectedStudents.length > 0
        ? `khiladi-selected-students-${today}.xlsx`
        : `khiladi-students-${today}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    toast.success(`${exportList.length} students export ho gaye`);
  };

  const handleSavePdf = () => {
    const exportList = printableStudents;

    if (exportList.length === 0) {
      toast.error("PDF ke liye koi student nahi mila");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const today = new Date().toLocaleDateString("en-IN");

    doc.setFontSize(16);
    doc.text("KHILADI Academy Manager", 40, 36);

    doc.setFontSize(12);
    doc.text("Students List", 40, 56);
    doc.text(`Date: ${today}`, 720, 56);

    autoTable(doc, {
      startY: 80,
      head: [
        [
          "S. No.",
          "Code",
          "Name",
          "Age",
          "Category",
          "Phone",
          "Batch",
          "Martial Art",
          "Belt",
          "Status",
        ],
      ],
      body: buildCompactRows(exportList),
      styles: {
        fontSize: 8,
        cellPadding: 5,
        overflow: "linebreak",
      },
      headStyles: {
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 90 },
        2: { cellWidth: 130 },
        3: { cellWidth: 40 },
        4: { cellWidth: 75 },
        5: { cellWidth: 75 },
        6: { cellWidth: 85 },
        7: { cellWidth: 80 },
        8: { cellWidth: 70 },
        9: { cellWidth: 60 },
      },
      margin: { left: 40, right: 40 },
    });

    const fileDate = new Date().toISOString().slice(0, 10);
    const fileName =
      selectedStudents.length > 0
        ? `khiladi-selected-students-${fileDate}.pdf`
        : `khiladi-students-${fileDate}.pdf`;

    doc.save(fileName);
    toast.success(`${exportList.length} students PDF save ho gaya`);
  };

  const handlePrint = () => {
    const printList = printableStudents;

    if (printList.length === 0) {
      toast.error("Print ke liye koi student nahi mila");
      return;
    }

    const didOpen = printDataTable({
      title: "KHILADI Academy Manager",
      subtitle: "Students List",
      columns: ["S. No.", "Code", "Name", "Age", "Category", "Phone", "Batch", "Martial Art", "Belt", "Status"],
      rows: printList.map((student, index) => [
        index + 1,
        student.studentCode || student.admissionNumber || "",
        getStudentFullName(student),
        student.age ?? "",
        student.ageCategory || "",
        student.phone || "",
        student.batch?.batchName || "",
        student.martialArt || "",
        displayBelt(student),
        student.status || "",
      ]),
    });

    if (!didOpen) {
      toast.error("Popup blocked hai. Browser me popup allow karein.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pehle students select karein");
      return;
    }

    const confirmed = window.confirm(
      `Kya aap selected ${selectedIds.length} students delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      setBulkDeleting(true);

      await Promise.all(selectedIds.map((id) => studentApi.remove(id)));

      toast.success(`${selectedIds.length} students delete ho gaye`);
      setSelectedIds([]);
      fetchStudents();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Selected students delete nahi hue"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportStudents = async (payload) => {
    try {
      const response = await studentApi.importBulk(payload);
      const summary = response?.data || response || {};

      toast.success(
        `Import complete: ${summary.imported || 0} imported, ${
          summary.skipped || 0
        } skipped, ${summary.failed || 0} failed`
      );

      await Promise.all([fetchBranches(), fetchBatches(), fetchStudents()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Student import failed");
      throw error;
    }
  };

  const handleDelete = async (student) => {
    const fullName = getStudentFullName(student);

    const confirmed = window.confirm(
      `Kya aap sach me "${
        fullName || student.admissionNumber || "this student"
      }" student ko delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      await studentApi.remove(student._id);
      toast.success("Student delete ho gaya");
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Student delete nahi hua");
    }
  };

  const clearFilters = () => setFilters({
    search: "", status: "", batch: "", martialArt: "",
    beltRank: "", ageCategory: "", bloodGroup: "",
  });

  const mainBranch = branches.find((branch) => branch?.isMainBranch) || branches[0];
  const academyAddress = [
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ].filter(Boolean).join(", ");

  return (
    <div className="page students-page">
      <StudentImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportStudents}
        branches={branches}
        batches={batches}
      />

      <AcademyHeroHeader
        headingId="students-academy-name"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={academyAddress || "Complete main branch address not available"}
        summaryItems={[
          {
            key: "branches",
            type: "branches",
            value: branches.length,
            label: `Active ${branches.length === 1 ? "Branch" : "Branches"}`,
          },
          {
            key: "batches",
            type: "batches",
            value: batches.length,
            label: `Active ${batches.length === 1 ? "Batch" : "Batches"}`,
          },
        ]}
      />

      <header className="students-heading-card">
        <div className="students-heading-card__copy">
          <span>Student Management</span>
          <div className="students-heading-card__title-row">
            <h1>Students</h1>
            <b><UsersRound size={16} /> {students.length} Students</b>
          </div>
          <p>Manage academy students, profiles and enrollment records.</p>
        </div>
        <div className="students-heading-card__actions">
          <button type="button" className="students-button" onClick={() => setImportModalOpen(true)}>
            <Upload size={17} /> Import Excel
          </button>
          <div className="students-export">
            <button type="button" className="students-button" onClick={() => setExportMenuOpen((open) => !open)} aria-expanded={exportMenuOpen}>
              <Download size={17} /> Export <ChevronDown size={15} />
            </button>
            {exportMenuOpen ? <div className="students-export__menu">
              <button type="button" onClick={() => { handleExportExcel(); setExportMenuOpen(false); }}><Download size={15} /> Export Excel</button>
              <button type="button" onClick={() => { handleSavePdf(); setExportMenuOpen(false); }}><FileText size={15} /> Save PDF</button>
              <button type="button" onClick={() => { handlePrint(); setExportMenuOpen(false); }}><Printer size={15} /> Print List</button>
            </div> : null}
          </div>
          <Link className="students-button students-button--primary" to="/students/new"><UserPlus size={17} /> Add Student</Link>
        </div>
      </header>

      <section className="students-metrics" aria-label="Student overview">
        <article className="students-metric students-metric--red"><span><UsersRound /></span><div><small>Total Students</small><strong>{students.length}</strong></div></article>
        <article className="students-metric students-metric--green"><span><UserCheck /></span><div><small>Active</small><strong>{activeCount}</strong></div></article>
        <article className="students-metric students-metric--amber"><span><UserX /></span><div><small>Profile Incomplete</small><strong>{incompleteCount}</strong></div></article>
        <article className="students-metric students-metric--blue"><span><UserPlus /></span><div><small>New This Month</small><strong>{newThisMonthCount}</strong></div></article>
      </section>

      <section className="students-filters" aria-label="Student filters">
        <div className="students-filters__primary">
          <label className="students-search"><Search size={18} /><input placeholder="Search name, phone, code or Aadhaar" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></label>
          <select aria-label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="left">Left</option></select>
          <select aria-label="Batch" value={filters.batch} onChange={(event) => setFilters((current) => ({ ...current, batch: event.target.value }))}><option value="">All Batches</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}</select>
          <button type="button" className="students-more-filter" onClick={() => setMoreFiltersOpen((open) => !open)}><Filter size={16} /> More Filters {activeFilterCount > 0 ? <b>{activeFilterCount}</b> : null}</button>
        </div>
        {moreFiltersOpen ? <div className="students-filters__more">
          <input placeholder="Martial Art" value={filters.martialArt} onChange={(event) => setFilters((current) => ({ ...current, martialArt: event.target.value }))} />
          <input placeholder="Belt Rank" value={filters.beltRank} onChange={(event) => setFilters((current) => ({ ...current, beltRank: event.target.value }))} />
          <select value={filters.ageCategory} onChange={(event) => setFilters((current) => ({ ...current, ageCategory: event.target.value }))}>{AGE_CATEGORIES.map((category) => <option key={category || "all"} value={category}>{category || "All Age Categories"}</option>)}</select>
          <select value={filters.bloodGroup} onChange={(event) => setFilters((current) => ({ ...current, bloodGroup: event.target.value }))}>{BLOOD_GROUPS.map((group) => <option key={group || "all"} value={group}>{group || "All Blood Groups"}</option>)}</select>
          <button type="button" onClick={clearFilters}>Clear all</button>
        </div> : null}
        {activeFilterCount > 0 ? <div className="students-filter-chips">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button type="button" key={key} onClick={() => setFilters((current) => ({ ...current, [key]: "" }))}>{String(value)} <X size={13} /></button>)}</div> : null}
      </section>

      <section className="students-table-card">
        {selectedIds.length > 0 ? <div className="students-table-toolbar students-table-toolbar--selection"><div><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /><span>{selectedIds.length} selected</span><button type="button" onClick={handleBulkDelete} disabled={bulkDeleting}><Trash2 size={15} />{bulkDeleting ? "Deleting…" : "Delete Selected"}</button></div></div> : null}
        {loading ? <div className="students-state"><span /> Loading students…</div> : students.length === 0 ? <div className="students-state"><UsersRound size={31} /><strong>No students found</strong><p>Try changing your filters or add a new student.</p></div> : <div className="students-table-wrap" onScroll={handleStudentsScroll}><table className="students-table">
          <thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /></th><th>Student</th><th>Age / Category</th><th>Contact</th><th>School / Class</th><th>Batch</th><th>Martial Art</th><th>Belt</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visibleStudents.map((student) => {
            const fullName = getStudentFullName(student);
            const selected = selectedIds.includes(student._id);
            return <tr key={student._id} className={selected ? "is-selected" : ""} onClick={() => navigate(`/students/${student._id}`)}>
              <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected} onChange={() => toggleSelectOne(student._id)} /></td>
              <td><div className="students-person"><strong>{fullName || "Unnamed Student"}</strong></div></td>
              <td><strong>{student.age ?? "—"}</strong><small>{student.ageCategory || "Not added"}</small></td>
              <td><strong>{student.phone || "—"}</strong><small>{student.email || "Not added"}</small></td>
              <td><strong>{student.schoolName || student.education?.schoolName || "—"}</strong><small>{[student.className, student.section].filter(Boolean).join(" - ") || "Not added"}</small></td>
              <td><strong>{student.batch?.batchName || "—"}</strong></td><td><strong>{student.martialArt || "—"}</strong></td><td><strong>{displayBelt(student)}</strong></td>
              <td onClick={(event) => event.stopPropagation()}>{["active", "inactive"].includes(student.status) ? <button type="button" className={`students-status is-${student.status}`} onClick={() => handleStatusToggle(student)} disabled={statusUpdatingIds.includes(student._id)}><i><span /></i>{statusUpdatingIds.includes(student._id) ? "Saving…" : student.status}</button> : <span className="students-left-status">{student.status || "—"}</span>}</td>
              <td onClick={(event) => event.stopPropagation()}><div className="students-row-actions"><Link to={`/students/${student._id}/edit`} title="Edit student" aria-label={`Edit ${fullName || "student"}`}><Edit3 size={16} /></Link><button type="button" className="students-row-actions__delete" title="Delete student" aria-label={`Delete ${fullName || "student"}`} onClick={() => handleDelete(student)}><Trash2 size={16} /></button></div></td>
            </tr>;
          })}</tbody>
        </table></div>}
        {!loading && students.length > 0 ? <footer className="students-list-footer"><span>Showing {visibleStudents.length} of {students.length} students</span>{visibleStudents.length < students.length ? <span>Scroll down to load more students</span> : <strong>All students loaded</strong>}</footer> : null}
      </section>
    </div>
  );

  /* Legacy markup kept below temporarily unreachable during the scoped redesign. */
  return (
    <div className="page">
      <StudentImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportStudents}
        branches={branches}
        batches={batches}
      />

      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Academy ke students manage karein</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 size={16} />
              {bulkDeleting
                ? "Deleting..."
                : `Delete Selected (${selectedIds.length})`}
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={handleExportExcel}
            disabled={loading || students.length === 0}
          >
            <Download size={16} />
            Export Excel
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleSavePdf}
            disabled={loading || students.length === 0}
          >
            <FileText size={16} />
            Save PDF
          </button>

          <button
            type="button"
            className="btn"
            onClick={handlePrint}
            disabled={loading || students.length === 0}
          >
            <Printer size={16} />
            Print
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload size={16} /> Import Excel
          </button>

          <Link className="btn btn-primary" to="/students/new">
            Add Student
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-5">
          <input
            placeholder="Search name, phone, code, Aadhaar"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
          />

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
          </select>

          <select
            value={filters.batch}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                batch: event.target.value,
              }))
            }
          >
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>

          <input
            placeholder="Martial Art"
            value={filters.martialArt}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                martialArt: event.target.value,
              }))
            }
          />

          <input
            placeholder="Belt Rank"
            value={filters.beltRank}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                beltRank: event.target.value,
              }))
            }
          />

          <select
            value={filters.ageCategory}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                ageCategory: event.target.value,
              }))
            }
          >
            {AGE_CATEGORIES.map((category) => (
              <option key={category || "all"} value={category}>
                {category || "All Age Categories"}
              </option>
            ))}
          </select>

          <select
            value={filters.bloodGroup}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                bloodGroup: event.target.value,
              }))
            }
          >
            {BLOOD_GROUPS.map((group) => (
              <option key={group || "all"} value={group}>
                {group || "All Blood Groups"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>School/Class</th>
                  <th>Batch</th>
                  <th>Martial Art</th>
                  <th>Belt</th>
                  <th>Blood</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const fullName = getStudentFullName(student);
                  const isSelected = selectedIds.includes(student._id);

                  return (
                    <tr
                      key={student._id}
                      onClick={() => navigate(`/students/${student._id}`)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "#f8fafc" : undefined,
                      }}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(student._id)}
                        />
                      </td>

                      <td>
                        {student.studentCode || student.admissionNumber || "-"}
                      </td>
                      <td>
                        <div>{fullName || "-"}</div>
                        {student.profileStatus === "incomplete" && (
                          <span
                            className="profile-incomplete-badge"
                            title={`Missing: ${(student.profileIncompleteFields || []).join(", ") || "profile details"}`}
                          >
                            Profile Incomplete
                          </span>
                        )}
                      </td>
                      <td>{student.age ?? "-"}</td>
                      <td>{student.ageCategory || "-"}</td>
                      <td>{student.phone || "-"}</td>
                      <td>
                        {student.schoolName ||
                          student.education?.schoolName ||
                          "-"}
                        {student.className || student.section ? (
                          <div className="muted">
                            {student.className || ""}
                            {student.section ? ` - ${student.section}` : ""}
                          </div>
                        ) : null}
                      </td>
                      <td>{student.batch?.batchName || "-"}</td>
                      <td>{student.martialArt || "-"}</td>
                      <td>{displayBelt(student)}</td>
                      <td>{student.bloodGroup || "-"}</td>
                      <td>
                        {["active", "inactive"].includes(student.status) ? (
                          <button
                            type="button"
                            className={`student-status-toggle student-status-toggle--${student.status}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStatusToggle(student);
                            }}
                            disabled={statusUpdatingIds.includes(student._id)}
                            aria-pressed={student.status === "active"}
                            aria-label={`Mark ${fullName || "student"} as ${
                              student.status === "active" ? "inactive" : "active"
                            }`}
                            title={`Click to mark ${
                              student.status === "active" ? "inactive" : "active"
                            }`}
                          >
                            <span className="student-status-toggle__track" aria-hidden="true">
                              <span className="student-status-toggle__thumb" />
                            </span>
                            <span className="student-status-toggle__label">
                              {statusUpdatingIds.includes(student._id)
                                ? "Saving..."
                                : student.status}
                            </span>
                          </button>
                        ) : (
                          <span className={`badge badge-${student.status}`}>
                            {student.status}
                          </span>
                        )}
                      </td>

                      <td
                        className="actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link to={`/students/${student._id}/edit`}>Edit</Link>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(student)}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
