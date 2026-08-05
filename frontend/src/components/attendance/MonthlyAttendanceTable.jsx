import React, { useMemo, useRef } from "react";
import { CalendarDays } from "lucide-react";
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

const displayValue = (value, fallback = "-") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const pad = (value) => String(value).padStart(2, "0");

const formatDateDDMMYY = (value) => {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw || raw === "-") return "-";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}-${mm}-${String(yyyy).slice(-2)}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, mm, dd, yy] = slashMatch;
    return `${pad(dd)}-${pad(mm)}-${String(yy).slice(-2)}`;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const [, dd, mm, yy] = dashMatch;
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

const formatEditableDueValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return raw;
  if (/^\d{1,2}$/.test(raw) || /[A-Za-z]/.test(raw)) return raw;
  return formatDateDDMMYY(raw);
};

const toDateInputValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const [, dd, mm, rawYear] = dashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${pad(mm)}-${pad(dd)}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, mm, dd, rawYear] = slashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${pad(mm)}-${pad(dd)}`;
  }

  return "";
};

const formatSelectedDate = (isoDate) => {
  const match = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1].slice(-2)}`;
};

const DateMetaInput = ({ value, onChange, placeholder, disabled, ariaLabel }) => {
  const pickerRef = useRef(null);

  const openPicker = () => {
    if (disabled || !pickerRef.current) return;
    try {
      if (typeof pickerRef.current.showPicker === "function") {
        pickerRef.current.showPicker();
      } else {
        pickerRef.current.click();
      }
    } catch {
      pickerRef.current.focus();
      pickerRef.current.click();
    }
  };

  return (
    <div className="monthly-register__date-picker">
      <input
        type="text"
        className="monthly-register__meta-input monthly-register__date-display"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={openPicker}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="monthly-register__calendar-button"
        onClick={openPicker}
        disabled={disabled}
        aria-label={`Open calendar: ${ariaLabel}`}
        title="Select date"
      >
        <CalendarDays size={15} aria-hidden="true" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        className="monthly-register__native-date"
        value={toDateInputValue(value)}
        onChange={(event) => onChange(formatSelectedDate(event.target.value))}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

const getDueDateValue = (row) => {
  return (
    row.importedDueDate ||
    row.feeDueDate ||
    "-"
  );
};

const getPaidDateValue = (row) => {
  return (
    row.importedPaidDate ||
    row.paidDate ||
    row.feePaidDate ||
    "-"
  );
};

const isToday = (day) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  return day.dateKey === todayKey;
};

const getHolidayMap = (days = [], rows = []) => {
  const map = {};

  days.forEach((day) => {
    if (isFutureDay(day) || isToday(day) || day.isSunday) {
      map[day.dateKey] = false;
      return;
    }

    const allCellsEmpty = rows.every(
      (row) => !String(row.attendance?.[day.dateKey] || "").trim()
    );

    map[day.dateKey] = allCellsEmpty;
  });

  return map;
};

const getFeeStatusValue = (row) => {
  return row.importedFeeStatus || row.feeStatus || "due";
};

const isFutureDay = (day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(`${day.dateKey}T00:00:00`);
  current.setHours(0, 0, 0, 0);

  return current > today;
};

const MonthlyAttendanceTable = ({
  days = [],
  rows = [],
  onRowsChange,
  loading = false,
}) => {
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const holidayMap = useMemo(
    () => getHolidayMap(days, safeRows),
    [days, safeRows]
  );

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

  const updateRowField = (rowIndex, field, value) => {
    if (typeof onRowsChange !== "function") return;

    onRowsChange(
      safeRows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
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
            <th rowSpan="2">Due Date</th>
            <th rowSpan="2">Paid Date</th>
            <th rowSpan="2">Fee Status</th>

            {days.map((day) => {
              const future = isFutureDay(day);
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
                    future ? "day-heading--future" : "",
                  ].join(" ")}
                >
                  {day.weekday}
                </th>
              );
            })}

            <th className="summary-heading" rowSpan="2">
              ABSENT
            </th>
            <th className="summary-heading" rowSpan="2">
              PRESENT
            </th>
            <th className="summary-heading" rowSpan="2">
              LEAVE
            </th>
            <th className="summary-heading" rowSpan="2">
              LATE
            </th>
            <th className="summary-heading" rowSpan="2">
              %
            </th>
          </tr>

          <tr>
            {days.map((day) => {
              const future = isFutureDay(day);
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
                    future ? "day-number--future" : "",
                  ].join(" ")}
                >
                  {String(day.day).padStart(2, "0")}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {safeRows.map((row, rowIndex) => (
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
                <DateMetaInput
                  value={displayValue(
                    formatEditableDueValue(getDueDateValue(row)),
                    ""
                  )}
                  onChange={(value) =>
                    updateRowField(
                      rowIndex,
                      "importedDueDate",
                      value
                    )
                  }
                  placeholder="Due date"
                  disabled={!onRowsChange}
                  ariaLabel={`Due date for ${
                    row.name || row.importedName || "student"
                  }`}
                />
              </td>

              <td>
                <DateMetaInput
                  value={displayValue(getPaidDateValue(row), "")}
                  onChange={(value) =>
                    updateRowField(
                      rowIndex,
                      "importedPaidDate",
                      value
                    )
                  }
                  placeholder="DD-MM-YY"
                  disabled={!onRowsChange}
                  ariaLabel={`Paid date for ${
                    row.name || row.importedName || "student"
                  }`}
                />
              </td>

              <td
                className={
                  String(getFeeStatusValue(row)).toLowerCase().includes("paid")
                    ? "fee-status fee-status--paid"
                    : "fee-status fee-status--due"
                }
              >
                {getFeeStatusValue(row)}
              </td>

              {days.map((day) => {
                const future = isFutureDay(day);
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
                      future ? "attendance-day-cell--future" : "",
                    ].join(" ")}
                  >
                    {future ? (
                      <span className="attendance-cell attendance-cell--future">
                        &nbsp;
                      </span>
                    ) : (
                      <AttendanceCell
                        value={row.attendance?.[day.dateKey] || ""}
                        onChange={(value) =>
                          updateCell(rowIndex, day.dateKey, value)
                        }
                        disabled={!onRowsChange}
                      />
                    )}
                  </td>
                );
              })}

              <AttendanceSummary row={row} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyAttendanceTable;
