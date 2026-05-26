import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    batch: "",
    martialArt: "",
    beltRank: "",
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          String(value || "").trim()
        )
      );

    const response = await studentApi.getAll(cleanFilters);

setStudents(response?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Students load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
   const response = await batchApi.getAll();

const list = Array.isArray(response.data)
  ? response.data
  : response.data?.data || [];

const activeBatches = list.filter((batch) => batch.isActive);

setBatches(activeBatches);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleDelete = async (student) => {
    const fullName = `${student.firstName || ""} ${
      student.lastName || ""
    }`.trim();

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
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Academy ke students manage karein</p>
        </div>

        <Link className="btn btn-primary" to="/students/new">
          Add Student
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-5">
          <input
            placeholder="Search name, phone, code"
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Batch</th>
                  <th>Martial Art</th>
                  <th>Belt</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const fullName = `${student.firstName || ""} ${
                    student.lastName || ""
                  }`.trim();

                  return (
                    <tr
                      key={student._id}
                      onClick={() => navigate(`/students/${student._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{student.studentCode || student.admissionNumber || "-"}</td>
                      <td>{student.name || fullName || "-"}</td>
                      <td>{student.phone || "-"}</td>
                      <td>{student.batch?.batchName || "-"}</td>
                      <td>{student.martialArt || "-"}</td>
                      <td>{student.beltRank || "-"}</td>
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