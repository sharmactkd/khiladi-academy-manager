import React from "react";

const statusLabels = {
  "": "",
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

const AttendanceCell = React.memo(({ value = "", onChange, disabled = false }) => {
  const status = statusLabels[value] !== undefined ? value : "";

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
      className={`attendance-cell attendance-cell--${status || "blank"}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      title="Click: blank → P → A → L → LT"
    >
      {statusLabels[status]}
    </button>
  );
});

AttendanceCell.displayName = "AttendanceCell";

export default AttendanceCell;