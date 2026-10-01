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

export function studentIdsFromOrderKeys(keys = []) {
  return [...new Set(
    (Array.isArray(keys) ? keys : [])
      .map((key) => String(key || ""))
      .filter((key) => key.startsWith("student:"))
      .map((key) => key.slice("student:".length))
      .filter(Boolean)
  )];
}

export function selectMonthlyOrder({ currentOrder, previousOrder, isCurrentRegister }) {
  // Legacy read-time snapshots have untrusted statuses, but their key order is
  // still the only persisted serial order. Keep the keys and ignore statuses.
  const currentKeys = Array.isArray(currentOrder?.keys)
    ? currentOrder.keys.filter(Boolean)
    : [];
  if (currentKeys.length) {
    const previousKeys = isCurrentRegister && Array.isArray(previousOrder?.keys)
      ? previousOrder.keys.filter(Boolean)
      : [];
    const currentKeySet = new Set(currentKeys);
    const missingPreviousKeys = previousKeys.filter((key) => !currentKeySet.has(key));
    const baselineMatchesPrevious = previousKeys.length > 0 &&
      Number(currentOrder?.baselineYear) === Number(previousOrder?.year) &&
      Number(currentOrder?.baselineMonth) === Number(previousOrder?.month);
    // Older builds could save October with active rows only. Reinsert missing
    // September rows at their September positions. A snapshot without baseline
    // provenance is repaired once even if it contains the same keys in a wrong
    // order. Once baseline provenance exists, October edits remain authoritative.
    const mustRepairLegacyBaseline = isCurrentRegister && previousKeys.length > 0 && !baselineMatchesPrevious;
    const reconciledKeys = mustRepairLegacyBaseline || missingPreviousKeys.length
      ? [...previousKeys, ...currentKeys.filter((key) => !previousKeys.includes(key))]
      : currentKeys;
    return {
      keys: reconciledKeys,
      revision: Number(currentOrder?.revision) || 0,
      inherited: false,
      inheritedFrom: null,
      reconciledFromPrevious: mustRepairLegacyBaseline || missingPreviousKeys.length > 0,
      statuses: currentOrder?.snapshotSource === "explicit-save" ? currentOrder.statuses || [] : [],
    };
  }

  const previousKeys = isCurrentRegister && Array.isArray(previousOrder?.keys)
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
      reconciledFromPrevious: false,
      statuses: [],
    };
  }

  return { keys: [], revision: 0, inherited: false, inheritedFrom: null, reconciledFromPrevious: false, statuses: [] };
}
