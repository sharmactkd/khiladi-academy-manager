import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, FileText, Printer, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";
import { getBranches } from "../../api/branchApi.js";
import StudentImportModal from "../../components/students/StudentImportModal.jsx";

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

  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
    } catch (error) {
      toast.error(error.response?.data?.message || "Students load nahi hue");
    } finally {
      setLoading(false);
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

  const buildExportRows = (list) => {
    return list.map((student, index) => ({
      "S. No.": index + 1,
      "Student Code": student.studentCode || student.admissionNumber || "",
      "Admission Number": student.admissionNumber || "",
      "Aadhaar Number": student.aadhaarNumber || "",
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
      "Medical Conditions": Array.isArray(student.medicalConditions)
        ? student.medicalConditions.join(", ")
        : "",
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

    const rowsHtml = printList
      .map((student, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.studentCode || student.admissionNumber || ""}</td>
            <td>${getStudentFullName(student)}</td>
            <td>${student.age ?? ""}</td>
            <td>${student.ageCategory || ""}</td>
            <td>${student.phone || ""}</td>
            <td>${student.batch?.batchName || ""}</td>
            <td>${student.martialArt || ""}</td>
            <td>${displayBelt(student)}</td>
            <td>${student.status || ""}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      toast.error("Popup blocked hai. Browser me popup allow karein.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Students List</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #111827;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 2px solid #111827;
              padding-bottom: 10px;
            }
            h1 { margin: 0; font-size: 22px; }
            p { margin: 4px 0 0; font-size: 13px; color: #374151; }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 7px;
              text-align: left;
              vertical-align: top;
            }
            th { background: #f3f4f6; font-weight: 700; }
            tr:nth-child(even) { background: #fafafa; }
            @media print {
              body { margin: 12mm; }
              .no-print { display: none; }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div>
              <h1>KHILADI Academy Manager</h1>
              <p>Students List</p>
            </div>

            <div>
              <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
              <p>Total Students: ${printList.length}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Code</th>
                <th>Name</th>
                <th>Age</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Batch</th>
                <th>Martial Art</th>
                <th>Belt</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
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
                      <td>{fullName || "-"}</td>
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
                        <span className={`badge badge-${student.status}`}>
                          {student.status}
                        </span>
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