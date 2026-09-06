import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";

const ParentStudentAttendance = () => {
  const { studentId } = useParams();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await parentPortalApi.getStudentAttendance(studentId);
        setRecords(response.data?.data?.records || []);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [studentId]);

  if (loading) return <div className="card">Loading attendance...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p>Student attendance history.</p>
        </div>

        <Link className="btn btn-secondary" to={`/parent/students/${studentId}`}>
          Back to Profile
        </Link>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Batch</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="4">No attendance records found.</td>
              </tr>
            ) : (
              records.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.batch?.batchName || "-"}</td>
                  <td>{item.record?.status || "-"}</td>
                  <td>{item.record?.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentStudentAttendance;