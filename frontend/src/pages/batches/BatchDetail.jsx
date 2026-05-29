import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStudentName = (student) => {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return student.name || fullName || "-";
};

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

        const batchData = batchRes.data?.data || null;

        const studentList = Array.isArray(studentRes.data)
          ? studentRes.data
          : studentRes.data?.data?.students || studentRes.data?.data || [];

        setBatch(batchData);
        setStudentCount(studentList.length || batchData?.students?.length || 0);
        setStudents(Array.isArray(studentList) ? studentList : []);
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

        <div className="actions">
          <Link className="btn btn-primary" to="/students/new">
            Add Student
          </Link>

          <Link className="btn btn-primary" to={`/batches/${batch._id}/edit`}>
            Edit Batch
          </Link>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{batch.isActive ? "active" : "inactive"}</strong>
        </div>

        <div className="card stat-card">
          <span>Students</span>
          <strong>{studentCount}</strong>
        </div>

        <div className="card stat-card">
          <span>Time</span>
          <strong>
            {formatTime(batch.schedule?.[0]?.startTime)} -{" "}
            {formatTime(batch.schedule?.[0]?.endTime)}
          </strong>
        </div>

        <div className="card stat-card">
          <span>Monthly Fee</span>
          <strong>{currency(batch.monthlyFee)}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Batch Fee Structure</h2>

        <div className="details-grid">
          <p>
            <strong>Monthly Fee:</strong> {currency(batch.monthlyFee)}
          </p>

          <p>
            <strong>Quarterly Fee:</strong> {currency(batch.quarterlyFee)}
          </p>

          <p>
            <strong>Annual Fee:</strong> {currency(batch.annualFee)}
          </p>

          <p>
            <strong>Fee Due Day:</strong> {batch.feeDueDay || 10}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Batch Details</h2>

        <div className="details-grid">
          <p>
            <strong>Days:</strong>{" "}
            {batch.schedule?.map((item) => item.day).join(", ") || "-"}
          </p>

          <p>
            <strong>Capacity:</strong> {batch.capacity || 0}
          </p>

          <p>
            <strong>Coach:</strong> {batch.coach?.name || "-"}
          </p>

          <p>
            <strong>Notes:</strong> {batch.notes || "-"}
          </p>
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
                  <th>Batch Monthly Fee</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentCode || student.admissionNumber || "-"}</td>

                    <td>
                      <Link to={`/students/${student._id}`}>
                        {getStudentName(student)}
                      </Link>
                    </td>

                    <td>{student.phone || "-"}</td>

                    <td>{student.beltRank || "-"}</td>

                    <td>{currency(batch.monthlyFee)}</td>
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