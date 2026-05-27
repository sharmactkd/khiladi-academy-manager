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
        {row.attendancePercentage || 0}%
      </td>
    </>
  );
};

export default AttendanceSummary;