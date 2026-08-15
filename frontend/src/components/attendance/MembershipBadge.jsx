const formatDueDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB").replaceAll("/", "-");
};

const getAdjustmentDays = (membership) => {
  if (!membership?.originalDueDate || !membership?.effectiveDueDate) return 0;
  const original = new Date(membership.originalDueDate);
  const effective = new Date(membership.effectiveDueDate);
  if (Number.isNaN(original.getTime()) || Number.isNaN(effective.getTime())) return 0;
  return Math.round((effective.getTime() - original.getTime()) / 86400000);
};

export const getMembershipDisplay = (membership, fallbackDueDate) => {
  const dueDate = membership?.effectiveDueDate || fallbackDueDate;
  if (!membership) return { label: formatDueDate(dueDate), tone: "neutral" };

  const remainingDays = Number(membership.remainingTrainingDays || 0);
  const unpaidMonths = Number(membership.unpaidMonths || 0);

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
  if (unpaidMonths > 0) {
    return {
      label: `${unpaidMonths}M Extra Due`,
      tone: "red",
    };
  }
  if (remainingDays > 0) {
    return {
      label: `${remainingDays} Days Left`,
      tone: "blue",
    };
  }

  const adjustmentDays = getAdjustmentDays(membership);
  if (adjustmentDays !== 0) {
    return {
      label: `${adjustmentDays > 0 ? "+" : ""}${adjustmentDays} Days · ${formatDueDate(dueDate)}`,
      tone: adjustmentDays > 0 ? "green" : "amber",
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
}) => {
  const badge = getMembershipDisplay(membership, fallbackDueDate);
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