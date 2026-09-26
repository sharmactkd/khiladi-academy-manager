export const formatRemainingTrainingTime = (value, uppercase = true) => {
  const totalDays = Math.max(0, Math.trunc(Number(value) || 0));
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const monthLabel = uppercase ? "M" : "M";
  const dayLabel = uppercase ? "D" : "D";
  return [months ? `${months}${monthLabel}` : "", days ? `${days}${dayLabel}` : ""]
    .filter(Boolean)
    .join(" ") || `0${dayLabel}`;
};

// Remaining training time replaces the date, never the fee status.
export const remainingDaysDisplay = (membership) => {
  const days = Number(membership?.remainingTrainingDays || 0);
  if (!Number.isFinite(days) || days <= 0) return null;
  return {
    label: `${formatRemainingTrainingTime(days)} LEFT`,
    tone: "blue",
  };
};
