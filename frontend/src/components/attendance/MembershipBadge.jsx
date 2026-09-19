import { remainingDaysDisplay } from "./remainingDaysDisplay.js";
import { formatFeeDueBalance, normalizeFeeStatus } from "../../utils/feeStatus.js";

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
  if (membership.feeStatus === "partial") return { label: "Partial", tone: "amber" };
  if (unpaidMonths > 0 || unpaidDays > 0) {
    return {
      label: formatFeeDueBalance(unpaidMonths, unpaidDays).replace("DUE", "Due"),
      tone: "red",
    };
  }
  const status = normalizeFeeStatus(membership.feeStatus, "paid");
  if (status === "due") return { label: "Due", tone: "red" };
  if (status === "partial") return { label: "Partial", tone: "amber" };
  if (status === "paid") return { label: "Paid", tone: "green" };

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
  dateOverride = "",
}) => {
  const badge = dateOnly
    ? (dateOverride ? { label: String(dateOverride), tone: "neutral" } : remainingDaysDisplay(membership)) || {
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
