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
