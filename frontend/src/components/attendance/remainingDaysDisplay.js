// Remaining training time replaces the date, never the fee status.
export const remainingDaysDisplay = (membership) => {
  const days = Number(membership?.remainingTrainingDays || 0);
  if (!Number.isFinite(days) || days <= 0) return null;
  const paused = membership?.status === "paused";
  return {
    label: `${paused ? "PAUSED · " : ""}${days} ${days === 1 ? "DAY" : "DAYS"} LEFT`,
    tone: paused ? "amber" : "blue",
  };
};
