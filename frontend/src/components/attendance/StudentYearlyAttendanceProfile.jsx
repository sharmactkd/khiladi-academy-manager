const pad = (value) => String(value || "").padStart(2, "0");

const formatDate = (value) => {
  if (!value) return "-";

  const raw = String(value || "").trim();

  if (!raw || raw === "-") return raw || "-";

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yy] = slash;
    return `${pad(dd)}-${pad(mm)}-${String(yy).slice(-2)}`;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dash) {
    const [, dd, mm, yy] = dash;
    return `${pad(dd)}-${pad(mm)}-${String(yy).slice(-2)}`;
  }

  const date = new Date(raw);

  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${String(
      date.getFullYear()
    ).slice(-2)}`;
  }

  return raw;
};

const getDayValue = (month, day) => {
  const key = month.days?.find((item) => item.day === day)?.dateKey;

  if (!key) return "";

  return month.attendance?.[key] || "";
};

const getCellClass = (value) => {
  if (value === "P") return "student-year-cell student-year-cell--present";
  if (value === "A") return "student-year-cell student-year-cell--absent";
  if (value === "L") return "student-year-cell student-year-cell--leave";
  if (value === "LT") return "student-year-cell student-year-cell--late";

  return "student-year-cell student-year-cell--blank";
};

const getMonthDayClass = (month, day) => {
  const dayInfo = month.days?.find((item) => item.day === day);

  if (!dayInfo) return "student-year-day student-year-day--disabled";
  if (dayInfo.isSunday) return "student-year-day student-year-day--sunday";

  const value = month.attendance?.[dayInfo.dateKey] || "";
  if (!value) return "student-year-day student-year-day--holiday";

  return "student-year-day";
};

const StudentYearlyAttendanceProfile = ({ data }) => {
  const student = data?.student || {};
  const months = Array.isArray(data?.months) ? data.months : [];
  const year = data?.year || new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const cell = (value) => value || "-";

  return (
    <div className="card" style={{ overflow: "auto" }}>
      <div style={{ minWidth: 1400 }}>
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <div><strong>Ad. Date:</strong> {student.joiningDate || "-"}</div>
          <div><strong>DOB:</strong> {student.dob || "-"}</div>
          <div><strong>Age:</strong> {student.age || "-"}</div>
          <div><strong>Name:</strong> {student.importedName || student.name || "-"}</div>
          <div><strong>Contact:</strong> {student.importedPhone || student.contact || "-"}</div>
          <div><strong>Father's Name:</strong> {student.fatherName || "-"}</div>
          <div><strong>School:</strong> {student.schoolName || "-"}</div>
          <div style={{ gridColumn: "span 2" }}>
            <strong>Address:</strong> {student.address || "-"}
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>{year}</th>
              <th>Fee Paid</th>
              <th>Fee Status</th>
              {days.map((day) => <th key={day}>{day}</th>)}
              <th>Absent</th>
              <th>Present</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.value}>
                <th>{month.fullLabel}</th>
                <td>{month.importedFeePaid || "-"}</td>
                <td>{month.importedFeeStatus || "-"}</td>
                {days.map((day) => {
                  const dateKey = month.days?.find((d) => d.day === day)?.dateKey;
                  const value = dateKey ? month.attendance?.[dateKey] : "";

                  return <td key={day}>{cell(value)}</td>;
                })}
                <td>{month.absentCount || 0}</td>
                <td>{month.presentCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentYearlyAttendanceProfile;