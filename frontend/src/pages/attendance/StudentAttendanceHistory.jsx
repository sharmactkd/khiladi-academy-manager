import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { attendanceApi } from "../../api/attendanceApi.js";
import StudentYearlyAttendanceProfile from "../../components/attendance/StudentYearlyAttendanceProfile.jsx";

const StudentAttendanceHistory = () => {
  const { studentId } = useParams();

  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const yearOptions = useMemo(() => {
    const start = currentYear - 30;
    const end = currentYear + 2;

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentYear]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await attendanceApi.getStudentYearlyProfile(studentId, {
        year,
      });

      setProfile(response.data?.data || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Student yearly attendance load nahi hui"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, year]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Attendance</h1>
          <p>
            {profile?.student?.importedName ||
              profile?.student?.name ||
              "Student yearly attendance"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button type="button" className="btn btn-secondary" onClick={fetchProfile}>
            Refresh
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p>Loading student attendance...</p>
        </div>
      ) : (
        <StudentYearlyAttendanceProfile data={profile} />
      )}
    </div>
  );
};

export default StudentAttendanceHistory;