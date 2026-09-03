export const calculateAccruedUnpaidMonths = (source, now = new Date()) => {
  const stored = Math.max(0, Number(source?.unpaidMonths || 0));
  if (!source?.autoMonthlyDue || !source?.effectiveDueDate || source?.status === "paused" || source?.status === "complimentary" || source?.feeRequired === false) return stored;
  const due = new Date(source.effectiveDueDate), current = new Date(now);
  if (Number.isNaN(due.getTime()) || Number.isNaN(current.getTime())) return stored;
  const dueDay = due.getUTCDate();
  const currentCycleDate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), Math.min(dueDay, new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate())));
  const dueCycleDate = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), dueDay));
  if (current < dueCycleDate) return stored;
  let elapsedMonths = (current.getUTCFullYear() - dueCycleDate.getUTCFullYear()) * 12 + current.getUTCMonth() - dueCycleDate.getUTCMonth();
  if (current < currentCycleDate) elapsedMonths -= 1;
  return stored + Math.max(0, elapsedMonths + 1);
};
