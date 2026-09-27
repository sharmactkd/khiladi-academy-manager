const WRAPPING_NOISE = /^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g;

const decodeValue = (value, depth = 0) => {
  if (depth > 6 || value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => decodeValue(item, depth + 1));
  if (typeof value !== "string") return [String(value)];

  const text = value.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (parsed !== text) return decodeValue(parsed, depth + 1);
  } catch {
    // Historical imports may contain broken JSON fragments; sanitize below.
  }

  return text.split(",").flatMap((part) => {
    const cleaned = part
      .replace(/\\+(["'\[\]])/g, "$1")
      .replace(WRAPPING_NOISE, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned ? [cleaned] : [];
  });
};

export const normalizeStringList = (value, { maxItems = 30, maxLength = 80 } = {}) => {
  const seen = new Set();
  const result = [];

  for (const rawItem of decodeValue(value)) {
    const item = String(rawItem || "")
      .replace(WRAPPING_NOISE, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
    if (!item || /[{}]/.test(item)) continue;
    const key = item.normalize("NFKC").toLocaleLowerCase("en-IN");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= maxItems) break;
  }

  return result;
};

export default normalizeStringList;
