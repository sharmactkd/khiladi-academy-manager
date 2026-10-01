export function applyRowOrder(rows, keys = []) {
  const ranks = new Map(keys.map((key, index) => [key, index]));
  return rows.map((row, index) => ({ row, index })).sort((a, b) =>
    (ranks.get(a.row.registerOrderKey) ?? keys.length) - (ranks.get(b.row.registerOrderKey) ?? keys.length) || a.index - b.index
  ).map(({ row }) => row);
}

export function moveRowKeys(keys, key, position) {
  if (!Number.isInteger(position) || position < 1 || position > keys.length || !keys.includes(key)) {
    const error = new Error(`Enter a position between 1 and ${keys.length}`);
    error.statusCode = 400;
    throw error;
  }
  const next = keys.filter((item) => item !== key);
  next.splice(position - 1, 0, key);
  return next;
}

export function previousMonthPeriod(year, month) {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  return numericMonth === 1
    ? { year: numericYear - 1, month: 12 }
    : { year: numericYear, month: numericMonth - 1 };
}

const isWithdrawnReadSnapshot = (order) =>
  Boolean(
    order &&
    order.snapshotSource !== "explicit-save" &&
    Array.isArray(order.statuses) &&
    order.statuses.length > 0
  );

export function selectMonthlyOrder({ currentOrder, previousOrder, isCurrentRegister }) {
  const currentIsWithdrawn = isWithdrawnReadSnapshot(currentOrder);
  const currentKeys = !currentIsWithdrawn && Array.isArray(currentOrder?.keys)
    ? currentOrder.keys.filter(Boolean)
    : [];
  if (currentKeys.length) {
    return {
      keys: currentKeys,
      revision: Number(currentOrder?.revision) || 0,
      inherited: false,
      inheritedFrom: null,
      statuses: currentOrder?.snapshotSource === "explicit-save" ? currentOrder.statuses || [] : [],
    };
  }

  const previousIsWithdrawn = isWithdrawnReadSnapshot(previousOrder);
  const previousKeys = isCurrentRegister && !previousIsWithdrawn && Array.isArray(previousOrder?.keys)
    ? previousOrder.keys.filter(Boolean)
    : [];
  if (previousKeys.length) {
    return {
      keys: previousKeys,
      // The previous month is only a visual baseline. Revision zero ensures
      // the first October edit creates an October-only document.
      revision: 0,
      inherited: true,
      inheritedFrom: {
        year: Number(previousOrder.year),
        month: Number(previousOrder.month),
      },
      statuses: [],
    };
  }

  return { keys: [], revision: 0, inherited: false, inheritedFrom: null, statuses: [] };
}
