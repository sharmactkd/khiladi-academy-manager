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

const isExcelImportRow = (row) => {
  return (
    row.rowType === "raw-import" ||
    row.source === "excel-import" ||
    Boolean(row.importedName) ||
    Boolean(row.importedRowNumber)
  );
};

const displayValue = (value, fallback = "-") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const formatExcelDate = (value) => {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "-") return raw || "-";

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (slashMatch) {
    const [, month, day, year] = slashMatch;

    return `${String(day).padStart(2, "0")}-${String(month).padStart(
      2,
      "0"
    )}-${String(year).slice(-2)}`;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);

  if (dashMatch) {
    const [, day, month, year] = dashMatch;

    return `${String(day).padStart(2, "0")}-${String(month).padStart(
      2,
      "0"
    )}-${String(year).slice(-2)}`;
  }

  return raw;
};

const getHolidayMap = (days = [], rows = []) => {
  const map = {};

  days.forEach((day) => {
    const allCellsEmpty = rows.every(
      (row) => !String(row.attendance?.[day.dateKey] || "").trim()
    );

    map[day.dateKey] = allCellsEmpty && !day.isSunday;
  });

  return map;
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

  const holidayMap = useMemo(
    () => getHolidayMap(days, safeRows),
    [days, safeRows]
  );

  const updateRowField = (rowIndex, field, value) => {
    if (typeof onRowsChange !== "function") return;

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
    if (typeof onRowsChange !== "function") return;

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
        No attendance records found for selected batch/month.
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
            <th rowSpan="2">Paid Date</th>
            <th rowSpan="2">Fee Paid</th>
            <th rowSpan="2">Fee Status</th>

            {days.map((day) => {
              const isHoliday = holidayMap[day.dateKey];

              return (
                <th
                  key={day.dateKey}
                  className={[
                    "day-heading",
                    day.isSunday ? "day-heading--sunday" : "",
                    day.isSaturday ? "day-heading--saturday" : "",
                    day.isToday ? "day-heading--today" : "",
                    isHoliday ? "day-heading--holiday" : "",
                  ].join(" ")}
                >
                  {day.weekday}
                </th>
              );
            })}

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
            {days.map((day) => {
              const isHoliday = holidayMap[day.dateKey];

              return (
                <th
                  key={`${day.dateKey}-day`}
                  className={[
                    "day-number",
                    day.isSunday ? "day-number--sunday" : "",
                    day.isSaturday ? "day-number--saturday" : "",
                    day.isToday ? "day-number--today" : "",
                    isHoliday ? "day-number--holiday" : "",
                  ].join(" ")}
                >
                  {String(day.day).padStart(2, "0")}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {safeRows.map((row, rowIndex) => {
            const excelRow = isExcelImportRow(row);

            return (
              <tr key={row.studentId || row.importedRowNumber || rowIndex}>
                <td className="sticky-col sticky-no">
                  {row.importedSerialNo || row.no || rowIndex + 1}
                </td>

                <td className="sticky-col sticky-name monthly-register__name">
                  {row.name || row.importedName || "-"}
                </td>

                <td className="sticky-col sticky-contact">
                  {row.contact || row.importedPhone || "-"}
                </td>

                <td>
                  <span>
                    {formatExcelDate(
                      row.importedPaidDate || row.feePaidDate || "-"
                    )}
                  </span>
                </td>

                <td>
                  <span>{formatExcelDate(row.importedFeePaid || row.feePaid)}</span>
                </td>

                <td
                  className={
                    String(row.feeStatus || row.importedFeeStatus || "")
                      .toLowerCase()
                      .includes("paid")
                      ? "fee-status fee-status--paid"
                      : "fee-status fee-status--due"
                  }
                >
                  {row.feeStatus || row.importedFeeStatus || "due"}
                </td>

                {days.map((day) => {
                  const isHoliday = holidayMap[day.dateKey];

                  return (
                    <td
                      key={`${
                        row.studentId || row.importedRowNumber || rowIndex
                      }-${day.dateKey}`}
                      className={[
                        "attendance-day-cell",
                        day.isSunday ? "attendance-day-cell--sunday" : "",
                        day.isSaturday ? "attendance-day-cell--saturday" : "",
                        day.isToday ? "attendance-day-cell--today" : "",
                        isHoliday ? "attendance-day-cell--holiday" : "",
                      ].join(" ")}
                    >
                      <AttendanceCell
                        value={row.attendance?.[day.dateKey] || ""}
                        onChange={(value) =>
                          updateCell(rowIndex, day.dateKey, value)
                        }
                        disabled={!onRowsChange}
                      />
                    </td>
                  );
                })}

                <AttendanceSummary row={row} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyAttendanceTable;