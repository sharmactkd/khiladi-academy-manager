const canAccrue = source =>
  source?.autoMonthlyDue &&
  source?.status !== "paused" &&
  source?.status !== "complimentary" &&
  source?.feeRequired !== false &&
  Number(source?.remainingTrainingDays || 0) <= 0;

export const dueCyclesThrough = (value, now = new Date()) => {
  const due = new Date(value), current = new Date(now);
  if (Number.isNaN(due.getTime()) || Number.isNaN(current.getTime())) return 0;
  const dueDay = due.getUTCDate();
  const dueCycleDate = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), dueDay));
  const currentDate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()));
  if (currentDate < dueCycleDate) return 0;
  let months = (currentDate.getUTCFullYear() - dueCycleDate.getUTCFullYear()) * 12 + currentDate.getUTCMonth() - dueCycleDate.getUTCMonth();
  const currentCycleDate = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    Math.min(dueDay, new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0)).getUTCDate()),
  ));
  if (currentDate < currentCycleDate) months -= 1;
  return Math.max(0, months + 1);
};

export const calculateMembershipAccrualState = (source, now = new Date()) => {
  const stored = Math.max(0, Number(source?.unpaidMonths || 0));
  const explicitNextDueDate = source?.nextDueDate ? new Date(source.nextDueDate) : null;
  const legacyDueDate = source?.effectiveDueDate ? new Date(source.effectiveDueDate) : null;
  const baseDate = explicitNextDueDate || legacyDueDate;
  if (!baseDate || Number.isNaN(baseDate.getTime()) || !canAccrue(source)) {
    return { unpaidMonths: stored, accruedCycles: 0, nextDueDate: baseDate };
  }

  const accruedCycles = dueCyclesThrough(baseDate, now);
  const nextDueDate = addBillingMonthsClamped(baseDate, accruedCycles);
  // Records created before nextDueDate existed used effectiveDueDate as the
  // oldest unpaid cycle and stored unpaidMonths as a materialized floor.
  // Preserve that contract until the record is next reconciled. New records
  // keep a true next-accrual date, so elapsed cycles are additive.
  const unpaidMonths = explicitNextDueDate
    ? stored + accruedCycles
    : Math.max(stored, accruedCycles);
  return { unpaidMonths, accruedCycles, nextDueDate };
};

export const calculateAccruedUnpaidMonths = (source, now = new Date()) =>
  calculateMembershipAccrualState(source, now).unpaidMonths;

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
