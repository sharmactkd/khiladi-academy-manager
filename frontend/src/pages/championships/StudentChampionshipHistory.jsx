import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { championshipRecordApi } from "../../api/championshipRecordApi.js";

const StudentChampionshipHistory = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await championshipRecordApi.getByStudent(studentId);
        setStudent(response.data?.data?.student || null);
        setRecords(response.data?.data?.championshipRecords || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load championship history"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [studentId]);

  if (loading) return <div className="card">Loading championship history...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Championship History</h1>
          <p>{student?.name || "Student"} tournament and medal record.</p>
        </div>

        <Link className="btn btn-secondary" to={`/students/${studentId}`}>
          Back to Student
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Championship</th>
              <th>Level</th>
              <th>Event</th>
              <th>Result</th>
              <th>Venue</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6">No championship history found.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.championshipName}</td>
                  <td>{record.level}</td>
                  <td>{record.eventType}</td>
                  <td>{record.result}</td>
                  <td>{record.venue || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentChampionshipHistory;