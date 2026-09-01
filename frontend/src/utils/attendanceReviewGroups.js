const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

// Group display rows only. Original attendance rows and their server keys survive.
export function groupAttendanceReview(matches, resolutions = {}) {
  const groups = new Map();
  for (const match of matches) {
    const resolution = resolutions[match.rowKey] || "";
    const studentId = resolution === "__skip__" ? "" : resolution || (match.status === "matched" ? String(match.student?._id || "") : "");
    const excluded = resolution === "__skip__" || match.status === "excluded";
    const identity = JSON.stringify([
      normalize(match.name) || match.rowKey,
      String(match.phone || "").replace(/\D/g, ""),
      normalize(match.admissionNumber),
    ]);
    // Different confirmed students must never collapse merely because names match.
    const key = studentId ? `student:${studentId}` : `${excluded ? "excluded" : "review"}:${identity}`;
    if (!groups.has(key)) groups.set(key, {
      ...match, groupKey: key, studentId, excluded, rowKeys: [], sources: [],
      attendanceCells: 0, names: new Set(), candidatesById: new Map(),
    });
    const group = groups.get(key);
    group.rowKeys.push(match.rowKey);
    group.sources.push({ sheet: match.sourceSheet, row: match.rowNumber, name: match.name });
    group.attendanceCells += Number(match.attendanceCells || 0);
    group.names.add(match.name || "");
    for (const student of match.candidates || []) group.candidatesById.set(student._id, student);
  }
  return Array.from(groups.values(), ({ names, candidatesById, ...group }) => ({
    ...group, name: Array.from(names).filter(Boolean).join(" / "),
    candidates: Array.from(candidatesById.values()),
  }));
}

export function resolveAttendanceGroup(current, group, studentId) {
  const next = { ...current };
  for (const key of group.rowKeys) next[key] = studentId;
  return next;
}
