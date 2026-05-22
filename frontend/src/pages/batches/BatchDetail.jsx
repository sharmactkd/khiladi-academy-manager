import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";

const BatchDetail = () => {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const [batchRes, studentRes] = await Promise.all([
          batchApi.getById(id),
          studentApi.getAll({ batch: id, status: "active" }),
        ]);

        setBatch(batchRes.data?.data?.batch);
        setStudentCount(batchRes.data?.data?.studentCount || 0);
        setStudents(studentRes.data?.data?.students || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Batch load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id]);

  if (loading) return <p>Loading batch...</p>;
  if (!batch) return <p>Batch not found.</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{batch.batchName}</h1>
          <p>{batch.martialArt}</p>
        </div>
        <Link className="btn btn-primary" to={`/batches/${batch._id}/edit`}>
          Edit Batch
        </Link>
      </div>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{batch.status}</strong>
        </div>
        <div className="card stat-card">
          <span>Students</span>
          <strong>{studentCount}</strong>
        </div>
        <div className="card stat-card">
          <span>Time</span>
          <strong>
            {batch.startTime || "-"} - {batch.endTime || "-"}
          </strong>
        </div>
      </div>

      <div className="card">
        <h2>Batch Details</h2>
        <div className="details-grid">
          <p><strong>Days:</strong> {batch.days?.join(", ") || "-"}</p>
          <p><strong>Max Students:</strong> {batch.maxStudents || 0}</p>
          <p><strong>Coach:</strong> {batch.coach?.name || "-"}</p>
          <p><strong>Notes:</strong> {batch.notes || "-"}</p>
        </div>
      </div>

      <div className="card">
        <div className="page-header">
          <div>
            <h2>Students in this Batch</h2>
            <p>Active students list</p>
          </div>
          <Link to={`/attendance/batch/${batch._id}`}>Attendance History</Link>
        </div>

        {students.length === 0 ? (
          <p>No active students in this batch.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Belt</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentCode}</td>
                    <td>
                      <Link to={`/students/${student._id}`}>
                        {student.name}
                      </Link>
                    </td>
                    <td>{student.phone || "-"}</td>
                    <td>{student.beltRank || "-"}</td>
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

export default BatchDetail;