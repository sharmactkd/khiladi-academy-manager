import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { beltTestApi } from "../../api/beltTestApi.js";

const StudentBeltHistory = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [beltTests, setBeltTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await beltTestApi.getByStudent(studentId);
        setStudent(response.data?.data?.student || null);
        setBeltTests(response.data?.data?.beltTests || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load belt history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [studentId]);

  if (loading) return <div className="card">Loading belt history...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Belt History</h1>
          <p>{student?.name || "Student"} belt test and promotion history.</p>
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
              <th>Current Belt</th>
              <th>Promoted To</th>
              <th>Result</th>
              <th>Examiner</th>
              <th>Certificate</th>
            </tr>
          </thead>

          <tbody>
            {beltTests.length === 0 ? (
              <tr>
                <td colSpan="6">No belt history found.</td>
              </tr>
            ) : (
              beltTests.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.testDate).toLocaleDateString()}</td>
                  <td>{record.currentBelt}</td>
                  <td>{record.promotedToBelt}</td>
                  <td>{record.result}</td>
                  <td>{record.examinerName || "-"}</td>
                  <td>{record.certificateNumber || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentBeltHistory;