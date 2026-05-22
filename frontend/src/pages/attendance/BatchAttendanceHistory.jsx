import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { attendanceApi } from "../../api/attendanceApi.js";

const BatchAttendanceHistory = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const fetchHistory = async () => {
    try {
      const response = await attendanceApi.getBatchHistory(batchId, filters);
      setBatch(response.data?.data?.batch);
      setAttendance(response.data?.data?.attendance || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Attendance load nahi hui");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [batchId]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Batch Attendance</h1>
          <p>{batch?.batchName || "Batch history"}</p>
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
        {attendance.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          attendance.map((item) => (
            <div className="card subtle-card" key={item._id}>
              <h3>{new Date(item.date).toLocaleDateString()}</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.records?.map((record) => (
                      <tr key={record.student?._id}>
                        <td>{record.student?.name || "-"}</td>
                        <td>{record.student?.studentCode || "-"}</td>
                        <td>{record.status}</td>
                        <td>{record.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchAttendanceHistory;