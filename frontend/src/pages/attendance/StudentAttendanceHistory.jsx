import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { attendanceApi } from "../../api/attendanceApi.js";

const StudentAttendanceHistory = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const fetchHistory = async () => {
    try {
      const response = await attendanceApi.getStudentHistory(studentId, filters);
      setStudent(response.data?.data?.student);
      setHistory(response.data?.data?.history || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Attendance load nahi hui");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Attendance</h1>
          <p>{student?.name || "Student history"}</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-3">
          <input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, from: e.target.value }))
            }
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, to: e.target.value }))
            }
          />
          <button onClick={fetchHistory}>Apply Filter</button>
        </div>
      </div>

      <div className="card">
        {history.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.batch?.batchName || "-"}</td>
                    <td>{item.record?.status || "-"}</td>
                    <td>{item.record?.note || "-"}</td>
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

export default StudentAttendanceHistory;