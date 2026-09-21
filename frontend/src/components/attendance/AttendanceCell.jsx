import React from "react";

const statusLabels = {
  "": "-",
  P: "P",
  A: "A",
  L: "L",
  LT: "LT",
};

const nextStatus = {
  "": "P",
  P: "A",
  A: "L",
  L: "LT",
  LT: "",
};

const AttendanceCell = React.memo(({
  value = "",
  onChange,
  disabled = false,
  isSunday = false,
  holiday = null,
  inactiveBlank = false,
}) => {
  const status = statusLabels[value] !== undefined ? value : "";
  const emptyLabel = inactiveBlank ? "" : holiday ? "H" : isSunday ? "S" : statusLabels[""];
  const visualStatus = status || (inactiveBlank ? "inactive-blank" : holiday ? "holiday" : isSunday ? "sunday" : "blank");
  const title = inactiveBlank
    ? "Attendance disabled for inactive student"
    : holiday
    ? `${holiday.title || "Holiday"}${holiday.description ? ` — ${holiday.description}` : ""}`
    : isSunday
      ? "Sunday — click to mark attendance"
      : "Click: blank → P → A → L → LT";

  const handleClick = () => {
    if (disabled) return;
    onChange(nextStatus[status]);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    const key = event.key.toUpperCase();

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(nextStatus[status]);
      return;
    }

    if (["P", "A", "L"].includes(key)) {
      event.preventDefault();
      onChange(key);
      return;
    }

    if (key === "T") {
      event.preventDefault();
      onChange("LT");
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onChange("");
    }
  };

  return (
    <button
      type="button"
      className={`attendance-cell attendance-cell--${visualStatus}${isSunday && !inactiveBlank ? " attendance-cell--sunday-day" : ""}${holiday && !inactiveBlank ? " attendance-cell--holiday-day" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      title={title}
    >
      {status ? statusLabels[status] : emptyLabel}
    </button>
  );
});

AttendanceCell.displayName = "AttendanceCell";

export default AttendanceCell;
