export const calculateAccruedUnpaidMonths = (source, now = new Date()) => {
  const stored = Math.max(0, Number(source?.unpaidMonths || 0));
  if (!source?.autoMonthlyDue || !source?.effectiveDueDate || source?.status === "paused" || source?.status === "complimentary" || source?.feeRequired === false || Number(source?.remainingTrainingDays || 0) > 0) return stored;
  const due = new Date(source.effectiveDueDate), current = new Date(now);
  if (Number.isNaN(due.getTime()) || Number.isNaN(current.getTime())) return stored;
  const dueDay = due.getUTCDate();
  const currentCycleDate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), Math.min(dueDay, new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate())));
  const dueCycleDate = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), dueDay));
  if (current < dueCycleDate) return stored;
  let elapsedMonths = (current.getUTCFullYear() - dueCycleDate.getUTCFullYear()) * 12 + current.getUTCMonth() - dueCycleDate.getUTCMonth();
  if (current < currentCycleDate) elapsedMonths -= 1;
  // `effectiveDueDate` is the oldest currently unpaid cycle. The stored
  // balance is a materialized/manual floor, not an amount to add again on
  // every read. Taking the maximum prevents the historical 1M -> 2M -> 3M
  // duplication while still allowing calendar accrual to catch up.
  return Math.max(stored, Math.max(0, elapsedMonths + 1));
};

export const addBillingMonthsClamped = (value, months = 1) => {
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return null;
  const day = source.getUTCDate();
  const targetMonth = source.getUTCMonth() + Number(months || 0);
  const year = source.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
};
