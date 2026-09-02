import { attendanceSourceKey } from "../../utils/attendanceImportActions.js";

export const norm = value => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const phone = value => String(value || "").replace(/\D/g, "");
export const studentName = s => s.name || [s.firstName, s.lastName].filter(Boolean).join(" ");
export const id = value => String(value?._id || value || "");
export const unwrap = response => response?.data?.data ?? response?.data ?? response;
export const list = (response, key) => { const data = unwrap(response); return Array.isArray(data) ? data : data?.[key] || []; };

export function directory(records, blocks) {
  const items = records.map(row => ({ key: `record:${row.sourceRowKey}`, row, name: row.name, phone: row.phone || "", record: true, attendance: [], sources: [row.sourceSheet] }));
  const groups = new Map();
  for (const block of blocks) for (const row of block.rows || []) {
    const key = JSON.stringify([norm(row.name), phone(row.phone), norm(row.admissionNumber)]);
    if (!groups.has(key)) groups.set(key, { row, entries: [] });
    groups.get(key).entries.push({ ...row, blockId: block.blockId });
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
  const admission = norm(item.row.admissionNumber || item.row.studentCode);
  const candidates = eligible.filter(s => admission && norm(s.admissionNumber) === admission);
  if (candidates.length === 1) {
    const candidate = candidates[0];
    if (norm(studentName(candidate)) !== norm(item.name) || (phone(item.phone) && phone(candidate.phone) && phone(item.phone) !== phone(candidate.phone)) || (item.row.dateOfBirth && candidate.dateOfBirth && String(item.row.dateOfBirth).slice(0, 10) !== String(candidate.dateOfBirth).slice(0, 10))) return { value: "", reason: "Admission matches but name/phone/DOB differs — review required" };
    return { value: id(candidate), reason: "Admission and name agree" };
  }
  const samePhone = eligible.filter(s => phone(item.phone) && phone(s.phone) === phone(item.phone));
  const exact = samePhone.filter(s => norm(studentName(s)) === norm(item.name));
  if (exact.length === 1 && samePhone.length === 1) {
    if (item.row.dateOfBirth && exact[0].dateOfBirth && String(item.row.dateOfBirth).slice(0, 10) !== String(exact[0].dateOfBirth).slice(0, 10)) return { value: "", reason: "Name/phone match but DOB differs — review required" };
    return { value: id(exact[0]), reason: "Name and phone agree" };
  }
  const names = eligible.filter(s => norm(studentName(s)) === norm(item.name));
  return { value: "", reason: names.length || samePhone.length || candidates.length ? "Possible existing student / conflicting identity — choose explicitly" : "No safe existing match — create or exclude explicitly" };
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
