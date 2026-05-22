import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";

const Students = () => {
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
      const response = await studentApi.getAll(filters);
      setStudents(response.data?.data?.students || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Students load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await batchApi.getAll({ status: "active" });
      setBatches(response.data?.data?.batches || []);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Student ko left mark karna hai?")) return;

    try {
      await studentApi.remove(id);
      toast.success("Student left mark ho gaya");
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Student update nahi hua");
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
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
          </select>

          <select
            value={filters.batch}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, batch: e.target.value }))
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
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, martialArt: e.target.value }))
            }
          />

          <input
            placeholder="Belt Rank"
            value={filters.beltRank}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, beltRank: e.target.value }))
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
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentCode}</td>
                    <td>{student.name}</td>
                    <td>{student.phone || "-"}</td>
                    <td>{student.batch?.batchName || "-"}</td>
                    <td>{student.martialArt || "-"}</td>
                    <td>{student.beltRank || "-"}</td>
                    <td>
                      <span className={`badge badge-${student.status}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="actions">
                      <Link to={`/students/${student._id}`}>View</Link>
                      <Link to={`/students/${student._id}/edit`}>Edit</Link>
                      <button onClick={() => handleDelete(student._id)}>
                        Left
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;