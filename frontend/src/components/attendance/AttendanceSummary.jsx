import React from "react";

const AttendanceSummary = ({ row }) => {
  return (
    <>
      <td className="monthly-register__summary monthly-register__summary--absent">
        {row.absentCount || 0}
      </td>
      <td className="monthly-register__summary monthly-register__summary--present">
        {row.presentCount || 0}
      </td>
      <td className="monthly-register__summary">
        {row.leaveCount || 0}
      </td>
      <td className="monthly-register__summary">
        {row.lateCount || 0}
      </td>
      <td className="monthly-register__summary">
        <div className="attendance-percentage">
          <strong>{row.attendancePercentage || 0}%</strong>
          <span aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, Number(row.attendancePercentage || 0)))}%` }} /></span>
        </div>
      </td>
    </>
  );
};

export default AttendanceSummary;