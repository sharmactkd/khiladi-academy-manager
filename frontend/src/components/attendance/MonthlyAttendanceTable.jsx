import React, { useMemo } from "react";
import AttendanceCell from "./AttendanceCell.jsx";
import AttendanceSummary from "./AttendanceSummary.jsx";

const recalculateRow = (row, days) => {
  const values = days.map((day) => row.attendance?.[day.dateKey] || "");

  const presentCount = values.filter((value) => value === "P").length;
  const absentCount = values.filter((value) => value === "A").length;
  const leaveCount = values.filter((value) => value === "L").length;
  const lateCount = values.filter((value) => value === "LT").length;
  const markedDays = presentCount + absentCount + leaveCount + lateCount;

  return {
    ...row,
    presentCount,
    absentCount,
    leaveCount,
    lateCount,
    attendancePercentage:
      markedDays > 0 ? Math.round((presentCount / markedDays) * 100) : 0,
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const MonthlyAttendanceTable = ({
  days = [],
  rows = [],
  onRowsChange,
  loading = false,
}) => {
  const safeRows = useMemo(() => {
    return Array.isArray(rows) ? rows : [];
  }, [rows]);

  const updateRowField = (rowIndex, field, value) => {
    const nextRows = safeRows.map((row, index) => {
      if (index !== rowIndex) return row;

      return {
        ...row,
        [field]: value,
      };
    });

    onRowsChange(nextRows);
  };

  const updateCell = (rowIndex, dateKey, value) => {
    const nextRows = safeRows.map((row, index) => {
      if (index !== rowIndex) return row;

      const nextRow = {
        ...row,
        attendance: {
          ...(row.attendance || {}),
          [dateKey]: value,
        },
      };

      return recalculateRow(nextRow, days);
    });

    onRowsChange(nextRows);
  };

  if (loading) {
    return (
      <div className="monthly-register__empty">
        Loading monthly attendance register...
      </div>
    );
  }

  if (!safeRows.length) {
    return (
      <div className="monthly-register__empty">
        No active students found for selected batch.
      </div>
    );
  }

  return (
    <div className="monthly-register-table-wrap">
      <table className="monthly-register-table">
        <thead>
          <tr>
            <th className="sticky-col sticky-no" rowSpan="2">
              No.
            </th>
            <th className="sticky-col sticky-name" rowSpan="2">
              NAME
            </th>
            <th className="sticky-col sticky-contact" rowSpan="2">
              Contact
            </th>
            <th rowSpan="2">Fee Due Date</th>
            <th rowSpan="2">Fee Paid Date</th>
            <th rowSpan="2">Fee Status</th>

            {days.map((day) => (
              <th
                key={day.dateKey}
                className={[
                  "day-heading",
                  day.isSunday ? "day-heading--sunday" : "",
                  day.isSaturday ? "day-heading--saturday" : "",
                  day.isToday ? "day-heading--today" : "",
                ].join(" ")}
              >
                {day.weekday}
              </th>
            ))}

            <th className="sticky-summary" rowSpan="2">
              ABSENT
            </th>
            <th className="sticky-summary sticky-summary-2" rowSpan="2">
              PRESENT
            </th>
            <th className="sticky-summary sticky-summary-3" rowSpan="2">
              LEAVE
            </th>
            <th className="sticky-summary sticky-summary-4" rowSpan="2">
              LATE
            </th>
            <th className="sticky-summary sticky-summary-5" rowSpan="2">
              %
            </th>
          </tr>

          <tr>
            {days.map((day) => (
              <th
                key={`${day.dateKey}-day`}
                className={[
                  "day-number",
                  day.isSunday ? "day-number--sunday" : "",
                  day.isSaturday ? "day-number--saturday" : "",
                  day.isToday ? "day-number--today" : "",
                ].join(" ")}
              >
                {String(day.day).padStart(2, "0")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {safeRows.map((row, rowIndex) => (
            <tr key={row.studentId || rowIndex}>
              <td className="sticky-col sticky-no">
                {row.no || rowIndex + 1}
              </td>

              <td className="sticky-col sticky-name monthly-register__name">
                {row.name || "-"}
              </td>

              <td className="sticky-col sticky-contact">
                {row.contact || "-"}
              </td>

              <td>
                <input
                  type="date"
                  className="monthly-register-date-input"
                  value={toDateInputValue(row.feeDueDate)}
                  onChange={(event) =>
                    updateRowField(rowIndex, "feeDueDate", event.target.value)
                  }
                />
              </td>

              <td>
  <input
    type="date"
    className="monthly-register-date-input"
    value={toDateInputValue(row.feePaidDate)}
    onChange={(event) =>
      updateRowField(rowIndex, "feePaidDate", event.target.value)
    }
  />
</td>

              <td
                className={
                  String(row.feeStatus || "").toLowerCase() === "paid"
                    ? "fee-status fee-status--paid"
                    : "fee-status fee-status--due"
                }
              >
                {row.feeStatus || "due"}
              </td>

              {days.map((day) => (
                <td
                  key={`${row.studentId}-${day.dateKey}`}
                  className={[
                    "attendance-day-cell",
                    day.isSunday ? "attendance-day-cell--sunday" : "",
                    day.isSaturday ? "attendance-day-cell--saturday" : "",
                    day.isToday ? "attendance-day-cell--today" : "",
                  ].join(" ")}
                >
                  <AttendanceCell
                    value={row.attendance?.[day.dateKey] || ""}
                    onChange={(value) =>
                      updateCell(rowIndex, day.dateKey, value)
                    }
                  />
                </td>
              ))}

              <AttendanceSummary row={row} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyAttendanceTable;