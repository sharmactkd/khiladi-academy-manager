import { remainingDaysDisplay } from "./remainingDaysDisplay.js";

export const formatDueDate = (value, format = "full") => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (format === "day") return String(date.getDate()).padStart(2, "0");
  return date.toLocaleDateString("en-GB").replaceAll("/", "-");
};

export const getMembershipDisplay = (membership, fallbackDueDate) => {
  const dueDate = membership?.effectiveDueDate || fallbackDueDate;
  if (!membership) return { label: formatDueDate(dueDate), tone: "neutral" };

  const remainingDays = Number(membership.remainingTrainingDays || 0);
  const unpaidMonths = Number(membership.unpaidMonths || 0);
  const unpaidDays = Number(membership.unpaidDays || 0);

  if (membership.status === "paused") {
    return {
      label: remainingDays > 0 ? `Paused · ${remainingDays} Days Left` : "Paused",
      tone: "amber",
    };
  }
  if (membership.status === "complimentary" || membership.feeStatus === "complimentary") {
    return { label: "Complimentary", tone: "purple" };
  }
  if (membership.feeStatus === "waived") return { label: "Fee Waived", tone: "purple" };
  if (remainingDays > 0) {
    return {
      label: `${remainingDays} Days Left`,
      tone: "blue",
    };
  }
  if (unpaidMonths > 0 || unpaidDays > 0) {
    const duration = [unpaidMonths ? `${unpaidMonths}M` : "", unpaidDays ? `${unpaidDays}D` : ""].filter(Boolean).join(", ");
    return {
      label: `${duration} Due`,
      tone: "red",
    };
  }
  if (membership.feeStatus === "overdue") {
    return { label: `Overdue · ${formatDueDate(dueDate)}`, tone: "red" };
  }

  return { label: formatDueDate(dueDate), tone: "neutral" };
};

const MembershipBadge = ({
  membership,
  fallbackDueDate = null,
  onClick,
  disabled = false,
  className = "",
  dateOnly = false,
  dateFormat = "full",
}) => {
  const badge = dateOnly
    ? remainingDaysDisplay(membership) || {
        label: formatDueDate(
          membership?.effectiveDueDate || fallbackDueDate || "-",
          dateFormat,
        ),
        tone: "neutral",
      }
    : getMembershipDisplay(membership, fallbackDueDate);

  return (
    <button
      type="button"
      className={`membership-badge membership-badge--${badge.tone}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={
        membership?.internalNote
          ? `${badge.label} — ${membership.internalNote}`
          : `${badge.label} — View and adjust membership`
      }
    >
      {badge.label}
    </button>
  );
};

export default MembershipBadge;
