const getBadge = (membership) => {
  if (!membership) return { label: "Manage", tone: "neutral" };
  if (membership.status === "paused") return { label: "Paused", tone: "amber" };
  if (membership.status === "complimentary" || membership.feeStatus === "complimentary") {
    return { label: "Complimentary", tone: "purple" };
  }
  if (membership.feeStatus === "waived") return { label: "Fee Waived", tone: "purple" };
  if (Number(membership.unpaidMonths || 0) > 0) {
    return {
      label: `${membership.unpaidMonths}M Extra Due`,
      tone: "red",
    };
  }
  if (Number(membership.remainingTrainingDays || 0) > 0) {
    return {
      label: `${membership.remainingTrainingDays} Days Left`,
      tone: "blue",
    };
  }
  if (membership.lastAdjustedAt) {
    return { label: "Adjusted", tone: "green" };
  }
  return { label: "Current", tone: "neutral" };
};

const MembershipBadge = ({ membership, onClick, disabled = false }) => {
  const badge = getBadge(membership);
  return (
    <button
      type="button"
      className={`membership-badge membership-badge--${badge.tone}`}
      onClick={onClick}
      disabled={disabled}
      title={membership?.internalNote || "View and adjust membership"}
    >
      {badge.label}
    </button>
  );
};

export default MembershipBadge;
