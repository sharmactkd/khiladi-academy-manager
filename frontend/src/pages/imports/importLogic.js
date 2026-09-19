import { attendanceSourceKey } from "../../utils/attendanceImportActions.js";

export const norm = value => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const phone = value => String(value || "").replace(/\D/g, "");
const date = value => value ? String(value).slice(0, 10) : "";
export const studentName = s => s.name || [s.firstName, s.lastName].filter(Boolean).join(" ");
export const id = value => String(value?._id || value || "");
export const unwrap = response => response?.data?.data ?? response?.data ?? response;
export const list = (response, key) => { const data = unwrap(response); return Array.isArray(data) ? data : data?.[key] || []; };

export function importCandidates(items, decisions, target = "all") {
  return items.filter(item => decisions[item.key] && decisions[item.key] !== "__skip__" && (target !== "new" || decisions[item.key] === "__new__"));
}

// Called only after a successful, validated fetch of the full student list.
// This stages choices; it never writes student records.
export function prepareImportChoices(items, students, batch, previous = {}) {
  const known = new Set(students.map(id));
  const next = Object.fromEntries(Object.entries(previous).filter(([, value]) =>
    value === "__new__" || value === "__skip__" || known.has(value)));
  const used = new Set(Object.values(next).filter(value => value && !value.startsWith("__")));
  for (const item of items) {
    if (next[item.key]) continue;
    if (!students.length) { next[item.key] = "__new__"; continue; }
    const value = suggest(item, students, batch)?.value;
    if (value && !used.has(value)) { next[item.key] = value; used.add(value); }
    else if (!value && !students.some(s => norm(studentName(s)) === norm(item.name) || (item.row.admissionNumber && norm(s.admissionNumber) === norm(item.row.admissionNumber)))) {
      // A different name sharing a parent's phone is a new identity, not a match.
      next[item.key] = "__new__";
    }
  }
  return next;
}

export function directory(records, blocks) {
  const items = records.map(row => ({ key: `record:${row.sourceRowKey}`, row, name: row.name, phone: row.phone || "", record: true, attendance: [], sources: [row.sourceSheet] }));
  const groups = new Map();
  for (const block of blocks) for (const row of block.rows || []) {
    const key = JSON.stringify([norm(row.name), phone(row.phone), norm(row.admissionNumber)]);
    if (!groups.has(key)) groups.set(key, { row, entries: [] });
    groups.get(key).entries.push({
      ...row,
      blockId: block.blockId,
      importedYear: block.year,
      importedMonth: block.month,
    });
  }
  for (const [key, group] of groups) {
    const matches = items.filter(item => item.record && norm(item.name) === norm(group.row.name) && (!phone(item.phone) || !phone(group.row.phone) || phone(item.phone) === phone(group.row.phone)));
    if (matches.length === 1) {
      matches[0].attendance.push(...group.entries);
      matches[0].sources = [...new Set([...matches[0].sources, ...group.entries.map(row => row.sourceSheet)])];
    } else items.push({ key: `attendance:${group.row.sourceSheet}:${group.row.importedRowNumber || group.row.rowNumber}`, row: { name: group.row.name, phone: group.row.phone || "", sourceSheet: group.row.sourceSheet, legacySourceSheets: [...new Set(group.entries.map(row => row.sourceSheet))], status: "inactive", importSource: "excel-attendance" }, name: group.row.name, phone: group.row.phone || "", record: false, attendance: group.entries, sources: [...new Set(group.entries.map(row => row.sourceSheet))] });
  }
  return items;
}

// Conflicting identifiers and name-only matches require a human decision.
export function suggest(item, students, batchId) {
  const eligible = students.filter(s => (!s.batch || id(s.batch) === id(batchId)) && s.status !== "left");
  const itemName = norm(item.name);
  const itemPhone = phone(item.phone);
  const itemDob = date(item.row.dateOfBirth);
  const admission = norm(item.row.admissionNumber || item.row.studentCode);
  const candidates = eligible.filter(s => admission && norm(s.admissionNumber) === admission);
  if (candidates.length > 1) return { value: "", reason: "Admission number is used by multiple app students — choose explicitly" };
  if (candidates.length === 1) {
    const candidate = candidates[0];
    if (norm(studentName(candidate)) !== itemName) return { value: "", reason: "Admission number matches, but the name differs — choose explicitly" };
    if (itemPhone && phone(candidate.phone) && itemPhone !== phone(candidate.phone)) return { value: "", reason: "Admission and name match, but the phone differs — choose explicitly" };
    if (itemDob && date(candidate.dateOfBirth) && itemDob !== date(candidate.dateOfBirth)) return { value: "", reason: "Admission and name match, but DOB differs — choose explicitly" };
    return { value: id(candidate), reason: "Admission and name agree" };
  }
  const samePhone = eligible.filter(s => itemPhone && phone(s.phone) === itemPhone);
  const exact = samePhone.filter(s => norm(studentName(s)) === itemName);
  if (exact.length === 1) {
    if (itemDob && date(exact[0].dateOfBirth) && itemDob !== date(exact[0].dateOfBirth)) return { value: "", reason: "Exact name and phone match, but DOB differs — choose explicitly" };
    return { value: id(exact[0]), reason: samePhone.length > 1 ? "Exact name and phone agree (shared phone safely resolved by name)" : "Exact name and phone agree" };
  }
  if (exact.length > 1) return { value: "", reason: "Multiple app students have this exact name and phone — choose explicitly" };
  const names = eligible.filter(s => norm(studentName(s)) === itemName);
  if (names.length > 1) return { value: "", reason: "Multiple app students have this name; phone does not identify one safely" };
  if (names.length === 1) return { value: "", reason: itemPhone ? "Name exists in the app, but the phone differs or is missing — choose explicitly" : "Name exists in the app, but Excel has no phone — choose explicitly" };
  if (samePhone.length) return { value: "", reason: "Phone is already used by another name (possibly a family number) — choose explicitly" };

  const sameIdentityOutsideScope = students.filter(s => norm(studentName(s)) === itemName && (!itemPhone || !phone(s.phone) || phone(s.phone) === itemPhone));
  if (sameIdentityOutsideScope.some(s => s.status === "left")) return { value: "", reason: "A matching student is marked Left — restore or choose explicitly" };
  if (sameIdentityOutsideScope.some(s => s.batch && id(s.batch) !== id(batchId))) return { value: "", reason: "A matching student exists in another batch — choose explicitly" };
  return { value: "", reason: "No safe existing match — create new or exclude" };
}

export function chunks(rows, size = 100) {
  const result = []; let current = [], bytes = 0;
  for (const row of rows) {
    const length = new TextEncoder().encode(JSON.stringify(row)).length;
    if (length > 800000) throw new Error("One row is too large. Split the source data.");
    if (current.length && (current.length >= size || bytes + length > 800000)) { result.push(current); current = []; bytes = 0; }
    current.push(row); bytes += length;
  }
  if (current.length) result.push(current);
  return result;
}

export function attendancePayloads(items, links, batchId, duplicateMode) {
  const byBlock = new Map();
  for (const item of items) {
    const student = links[item.key];
    if (!student || student.startsWith("__")) continue;
    for (const row of item.attendance) {
      if (!byBlock.has(row.blockId)) byBlock.set(row.blockId, []);
      byBlock.get(row.blockId).push({ row, student });
    }
  }
  const result = [];
  for (const [blockId, entries] of byBlock) for (const part of chunks(entries)) {
    const rows = part.map(entry => entry.row);
    result.push({ blockId, fallbackBatch: batchId, duplicateMode, rows, resolutions: Object.fromEntries(part.map(entry => [attendanceSourceKey(entry.row), entry.student])) });
  }
  return result;
}

export function safeCsv(rows) {
  return rows.map(row => row.map(value => {
    const raw = String(value ?? "");
    const safe = /^[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
}

export function journalSummary(entries = []) {
  const result = { created: 0, updated: 0, unchanged: 0, attendance: 0, skipped: 0, failed: 0, uncertain: 0 };
  for (const entry of entries) {
    if (entry.status !== "done") { result.uncertain++; continue; }
    const data = entry.response?.data || {};
    if (entry.httpStatus >= 400) { result.failed++; continue; }
    result.failed += Number(data.failed || 0);
    if (entry.key.startsWith("students-")) { result.created += Number(data.imported || 0); result.updated += Number(data.updated || 0); result.unchanged += Math.max(0, Number(data.skipped || 0) - Number(data.updated || 0)); }
    else { result.attendance += Number(data.imported || 0); result.skipped += Number(data.skipped || 0); }
  }
  return result;
}
