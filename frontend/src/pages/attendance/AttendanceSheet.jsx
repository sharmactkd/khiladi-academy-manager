import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";

const today = new Date().toISOString().slice(0, 10);

const AttendanceSheet = () => {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [batch, setBatch] = useState("");
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
     const response = await batchApi.getAll();

const list = response.data?.data || [];
const activeBatches = list.filter((batch) => batch.isActive);

setBatches(activeBatches);

if (activeBatches.length) {
  setBatch((prev) => prev || activeBatches[0]._id);
}
      } catch {
        toast.error("Batches load nahi hue");
      }
    };

    fetchBatches();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!batch) {
        setStudents([]);
        setRecords({});
        return;
      }

      try {
        setLoading(true);
        const response = await studentApi.getAll({
          batch,
          status: "active",
          limit: 100,
        });

        const list = response?.data || [];
setStudents(list);

        const initialRecords = {};
        list.forEach((student) => {
          initialRecords[student._id] = {
            student: student._id,
            status: "present",
            note: "",
          };
        });

        setRecords(initialRecords);
      } catch {
        toast.error("Students load nahi hue");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [batch]);

  const updateRecord = (studentId, field, value) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

 const handleSubmit = async () => {
  if (!batch) {
    toast.error("Batch select karein");
    return;
  }

  if (!date) {
    toast.error("Date select karein");
    return;
  }

  const payload = {
    batch,
    date,
    records: Object.values(records),
  };

  if (!payload.records.length) {
    toast.error("Attendance records empty hain");
    return;
  }

  try {
    setLoading(true);

    const response = await attendanceApi.mark(payload);

    if (response?.data?.success) {
      toast.success("Attendance marked successfully");
      return;
    }

    toast.success("Attendance saved");
  } catch (error) {
    toast.error(error.response?.data?.message || "Attendance save nahi hui");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p>Batch wise daily attendance mark karein</p>
        </div>
       <button
  className="btn btn-primary"
  onClick={handleSubmit}
  disabled={loading || !batch}
>
  {loading ? "Saving..." : "Save Attendance"}
</button>
      </div>

      <div className="card">
        <div className="grid grid-2">
         <div className="batch-toggle-section">
  <span className="batch-toggle-label">Batch</span>

  <div className="batch-toggle-group">
    {batches.map((item) => (
      <button
        key={item._id}
        type="button"
        className={`batch-toggle-btn ${
          batch === item._id ? "active" : ""
        }`}
        onClick={() => setBatch(item._id)}
      >
        {item.batchName} - {item.martialArt}
      </button>
    ))}
  </div>
</div>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading students...</p>
        ) : !batch ? (
          <p>Please select a batch.</p>
        ) : students.length === 0 ? (
          <p>No active students in this batch.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                   <td>{student.admissionNumber || "-"}</td>

<td>
  {`${student.firstName || ""} ${student.lastName || ""}`.trim() || "-"}
</td>

<td>{student.phone || "-"}</td>
                    <td>
                      <select
                        value={records[student._id]?.status || "present"}
                        onChange={(e) =>
                          updateRecord(student._id, "status", e.target.value)
                        }
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                    <td>
                      <input
                        value={records[student._id]?.note || ""}
                        placeholder="Optional note"
                        onChange={(e) =>
                          updateRecord(student._id, "note", e.target.value)
                        }
                      />
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

export default AttendanceSheet;