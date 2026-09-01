// Must mirror getAttendanceImportRowKey in attendanceController.js.
export function attendanceSourceKey(row, index = 0) {
  const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
  const name = clean(row.name).toLowerCase().replace(/\([^)]*\)/g, "")
    .replace(/\b(mammi|mummy|papa|father|mother|guardian)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  return [clean(row.sourceSheet).toLowerCase() || "sheet",
    Number(row.importedRowNumber || row.rowNumber || index + 2),
    clean(row.phone).replace(/\D/g, "").slice(-10), name].join("::");
}

export function chunkAttendanceResolutions(rows, resolutions) {
  const chunk = {};
  rows.forEach((row, index) => {
    const key = attendanceSourceKey(row, index);
    if (!Object.prototype.hasOwnProperty.call(resolutions, key)) {
      throw new Error("A source row has no reviewed identity. Run student matching again.");
    }
    chunk[key] = resolutions[key];
  });
  return chunk;
}

// Snapshot confirmed identities; skipping unresolved rows here does not change
// review state or permanently exclude them from subsequent imports.
export function buildAttendanceImportResolutions(groups, matchedOnly = false) {
  const resolutions = {};
  for (const group of groups) {
    if (!group.studentId && !group.excluded && !matchedOnly) {
      throw new Error("Confirm or exclude unmatched students, or choose Import matched only.");
    }
    for (const key of group.rowKeys) resolutions[key] = group.studentId || "__skip__";
  }
  return resolutions;
}

export function provisionalStudentValues(group) {
  const name = String(group.sources?.[0]?.name || group.name || "").trim();
  const [firstName = "", ...last] = name.split(/\s+/);
  const lastName = last.join(" ");
  if (!firstName || firstName.length > 100 || lastName.length > 100) {
    throw new Error("Please correct this student's name using Create student record first.");
  }
  return { firstName, lastName, status: "inactive" };
}
