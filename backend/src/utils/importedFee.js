export const parseImportedFeeBalance = value => {
  const raw = String(value ?? "").trim().toUpperCase();
  const months = Number(raw.match(/(\d+)\s*M(?:ONTHS?)?\b/)?.[1] || 0);
  const days = Number(raw.match(/(\d+)\s*D(?:AYS?)?\b/)?.[1] || 0);
  return { months: Math.min(months, 120), days: Math.min(days, 29) };
};
