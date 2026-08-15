import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceCell from "./AttendanceCell.jsx";
import AttendanceSummary from "./AttendanceSummary.jsx";
import MembershipBadge from "./MembershipBadge.jsx";
import AttendanceDayNoteDialog, {
  DAY_NOTE_OPTIONS,
} from "./AttendanceDayNoteDialog.jsx";

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

const formatDateDDMMYYYY = (value) => {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw || raw === "-") return "-";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, mm, dd, yy] = slashMatch;
    const yyyy = String(yy).length === 2 ? `20${yy}` : yy;
    return `${pad(dd)}-${pad(mm)}-${yyyy}`;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const [, dd, mm, yy] = dashMatch;
    const yyyy = String(yy).length === 2 ? `20${yy}` : yy;
    return `${pad(dd)}-${pad(mm)}-${yyyy}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  }

  return raw;
};

const formatEditableDueValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return raw;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return formatDateDDMMYYYY(raw);
  }

  // Old imported registers may contain only a day number or text.
  if (/^\d{1,2}$/.test(raw) || /[A-Za-z]/.test(raw)) return raw;

  return formatDateDDMMYYYY(raw);
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
  const match = String(isoDate || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const DateMetaInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  ariaLabel,
}) => {
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

      <input
        ref={pickerRef}
        type="date"
        className="monthly-register__native-date"
        value={toDateInputValue(value)}
        onChange={(event) =>
          onChange(formatSelectedDate(event.target.value))
        }
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

const getDueDateValue = (row) =>
  row.importedDueDate || row.feeDueDate || "-";

const getPaidDateValue = (row) =>
  row.importedPaidDate || row.paidDate || row.feePaidDate || "-";

const getFeeStatusValue = (row) =>
  row.importedFeeStatus || row.feeStatus || "due";

const isFutureDay = (day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(`${day.dateKey}T00:00:00`);
  current.setHours(0, 0, 0, 0);

  return current > today;
};

const getDayClassName = (baseClass, day, hasNote) =>
  [
    baseClass,
    day.isSunday ? `${baseClass}--sunday` : "",
    day.isSaturday ? `${baseClass}--saturday` : "",
    day.isToday ? `${baseClass}--today` : "",
    hasNote ? `${baseClass}--noted` : "",
    isFutureDay(day) ? `${baseClass}--future` : "",
  ]
    .filter(Boolean)
    .join(" ");

const getDayStyle = (note) =>
  note
    ? {
        "--day-note-color": note.color || "#e2e8f0",
      }
    : undefined;

const AttendanceTable = ({
  days = [],
  rows = [],
  dayNotes = {},
  onRowsChange,
  onSaveDayNote,
  onRemoveDayNote,
  onToggleStudentStatus,
  onOpenMembership,
  canManageMembership = false,
  statusUpdatingIds = [],
  loading = false,
}) => {
  const navigate = useNavigate();
  const safeRows = useMemo(
    () => (Array.isArray(rows) ? rows : []),
    [rows]
  );

  const [contextMenu, setContextMenu] = useState(null);
  const [noteEditor, setNoteEditor] = useState(null);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setNoteEditor(null);
      }
    };

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const openDateMenu = (event, day) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      type: "date",
      x: event.clientX,
      y: event.clientY,
      day,
    });
  };

  const openStudentMenu = (event, row) => {
    if (
      !row.studentId ||
      !["active", "inactive"].includes(String(row.status).toLowerCase())
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      type: "student",
      x: event.clientX,
      y: event.clientY,
      row,
    });
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

  const updateRowField = (rowIndex, field, value) => {
    if (typeof onRowsChange !== "function") return;

    onRowsChange(
      safeRows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const editExistingNote = () => {
    const dateKey = contextMenu.day.dateKey;

    setNoteEditor({
      dateKey,
      existingNote: dayNotes[dateKey],
    });
    setContextMenu(null);
  };

  const createNote = (type) => {
    setNoteEditor({
      dateKey: contextMenu.day.dateKey,
      initialType: type,
    });
    setContextMenu(null);
  };

  const removeNote = async () => {
    const dateKey = contextMenu.day.dateKey;
    setContextMenu(null);

    if (typeof onRemoveDayNote === "function") {
      await onRemoveDayNote(dateKey);
    }
  };

  const toggleStudentStatus = async () => {
    const row = contextMenu.row;
    const currentStatus = String(row.status).toLowerCase();
    const nextStatus = currentStatus === "active" ? "inactive" : "active";

    setContextMenu(null);

    if (typeof onToggleStudentStatus === "function") {
      await onToggleStudentStatus(row, nextStatus);
    }
  };

  const openStudentProfile = (row) => {
    if (!row.studentId) return;
    navigate(`/students/${row.studentId}`);
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
    <>
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

              <th className="sticky-col sticky-due-date" rowSpan="2">Due Date</th>
              <th className="sticky-col sticky-paid-date" rowSpan="2">Paid Date</th>
              <th className="sticky-col sticky-membership" rowSpan="2">Membership</th>
              <th className="sticky-col sticky-fee-status" rowSpan="2">Fee Status</th>

              {days.map((day) => {
                const note = dayNotes[day.dateKey];

                return (
                  <th
                    key={day.dateKey}
                    className={getDayClassName(
                      "day-heading",
                      day,
                      Boolean(note)
                    )}
                    style={getDayStyle(note)}
                    onContextMenu={(event) => openDateMenu(event, day)}
                    title="Right click to add or edit a date note"
                  >
                    {day.weekday}

                    {note && (
                      <>
                        <span
                          className="day-note-marker"
                          aria-hidden="true"
                        >
                          •
                        </span>

                        <span
                          className="day-note-tooltip"
                          role="tooltip"
                        >
                          <strong>{note.title}</strong>
                          <span>{day.dateKey}</span>

                          {note.description && (
                            <small>{note.description}</small>
                          )}
                        </span>
                      </>
                    )}
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
                const note = dayNotes[day.dateKey];

                return (
                  <th
                    key={`${day.dateKey}-day`}
                    className={getDayClassName(
                      "day-number",
                      day,
                      Boolean(note)
                    )}
                    style={getDayStyle(note)}
                    onContextMenu={(event) => openDateMenu(event, day)}
                    title="Right click to add or edit a date note"
                  >
                    {String(day.day).padStart(2, "0")}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {safeRows.map((row, rowIndex) => {
              const rowKey =
                row.studentId || row.importedRowNumber || rowIndex;
              const isInactive =
                String(row.status).toLowerCase() === "inactive";

              return (
                <tr
                  key={rowKey}
                  className={
                    isInactive ? "monthly-register__row--inactive" : ""
                  }
                >
                  <td className="sticky-col sticky-no">
                    {row.importedSerialNo || row.no || rowIndex + 1}
                  </td>

                  <td className="sticky-col sticky-membership">
                    {row.rowType === "student" && row.studentId ? (
                      <MembershipBadge
                        membership={row.membership}
                        onClick={canManageMembership ? () => onOpenMembership?.(row) : undefined}
                        disabled={!canManageMembership}
                      />
                    ) : (
                      <span className="membership-unavailable">—</span>
                    )}
                  </td>

                  <td
                    className="sticky-col sticky-name monthly-register__name"
                    onContextMenu={(event) => openStudentMenu(event, row)}
                    onDoubleClick={() => openStudentProfile(row)}
                    title={
                      row.studentId
                        ? "Double click to open profile · Right click to change status"
                        : undefined
                    }
                  >
                    <div className="attendance-student-cell">
                      <strong>{row.name || row.importedName || "-"}</strong>
                    </div>
                  </td>

                  <td className="sticky-col sticky-contact">
                    {row.contact || row.importedPhone || "-"}
                  </td>

                  <td className="sticky-col sticky-due-date">
                    {row.rowType === "student" && row.studentId ? (
                      <button
                        type="button"
                        className="membership-due-date"
                        onClick={canManageMembership ? () => onOpenMembership?.(row) : undefined}
                        disabled={!canManageMembership}
                        title="Manage this date from Membership"
                      >
                        {displayValue(formatEditableDueValue(getDueDateValue(row)), "-")}
                      </button>
                    ) : (
                      <DateMetaInput
                        value={displayValue(
                          formatEditableDueValue(getDueDateValue(row)),
                          ""
                        )}
                        onChange={(value) =>
                          updateRowField(rowIndex, "importedDueDate", value)
                        }
                        placeholder="DD-MM-YYYY"
                        disabled={!onRowsChange}
                        ariaLabel={`Due date for ${
                          row.name || row.importedName || "student"
                        }`}
                      />
                    )}
                  </td>

                  <td className="sticky-col sticky-paid-date">
                    <DateMetaInput
                      value={displayValue(
                        formatEditableDueValue(getPaidDateValue(row)),
                        ""
                      )}
                      onChange={(value) =>
                        updateRowField(rowIndex, "importedPaidDate", value)
                      }
                      placeholder="DD-MM-YYYY"
                      disabled={!onRowsChange}
                      ariaLabel={`Paid date for ${
                        row.name || row.importedName || "student"
                      }`}
                    />
                  </td>

                  <td
                    className={`sticky-col sticky-fee-status ${
                      String(getFeeStatusValue(row))
                        .toLowerCase()
                        .includes("paid")
                        ? "fee-status fee-status--paid"
                        : "fee-status fee-status--due"
                    }`}
                  >
                    {getFeeStatusValue(row)}
                  </td>

                  {days.map((day) => {
                    const future = isFutureDay(day);
                    const note = dayNotes[day.dateKey];

                    return (
                      <td
                        key={`${rowKey}-${day.dateKey}`}
                        className={getDayClassName(
                          "attendance-day-cell",
                          day,
                          Boolean(note)
                        )}
                        style={getDayStyle(note)}
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
                            // A holiday/note never disables attendance.
                            disabled={!onRowsChange}
                          />
                        )}
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

      {contextMenu && (
        <div
          className="attendance-context-menu"
          style={{
            left: Math.max(
              8,
              Math.min(contextMenu.x, window.innerWidth - 270)
            ),
            top: Math.max(
              8,
              Math.min(contextMenu.y, window.innerHeight - 330)
            ),
          }}
          onClick={(event) => event.stopPropagation()}
          role="menu"
        >
          {contextMenu.type === "date" && (
            <>
              {dayNotes[contextMenu.day.dateKey] ? (
                <>
                  <button type="button" onClick={editExistingNote}>
                    Edit note / colour
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={removeNote}
                  >
                    Remove note
                  </button>
                </>
              ) : (
                DAY_NOTE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => createNote(option.type)}
                  >
                    <span
                      className="context-color"
                      style={{ backgroundColor: option.color }}
                      aria-hidden="true"
                    />

                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </span>
                  </button>
                ))
              )}
            </>
          )}

          {contextMenu.type === "student" && (
            <button
              type="button"
              disabled={statusUpdatingIds.includes(
                contextMenu.row.studentId
              )}
              onClick={toggleStudentStatus}
            >
              Mark {contextMenu.row.status === "active" ? "Inactive" : "Active"}
            </button>
          )}
        </div>
      )}

      {noteEditor && (
        <AttendanceDayNoteDialog
          dateKey={noteEditor.dateKey}
          existingNote={noteEditor.existingNote}
          initialType={noteEditor.initialType}
          onSave={onSaveDayNote}
          onClose={() => setNoteEditor(null)}
        />
      )}
    </>
  );
};

export default AttendanceTable;
