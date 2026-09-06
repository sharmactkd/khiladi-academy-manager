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
      historyByIdentity: new Map(),
    });
    const group = groups.get(key);
    group.rowKeys.push(match.rowKey);
    group.sources.push({ sheet: match.sourceSheet, row: match.rowNumber, name: match.name });
    group.attendanceCells += Number(match.attendanceCells || 0);
    group.names.add(match.name || "");
    for (const student of match.candidates || []) group.candidatesById.set(student._id, student);
    if (!["matched", "excluded"].includes(match.status)) {
      if (!group.historyByIdentity.has(identity)) group.historyByIdentity.set(identity, {
        ...match,
        groupKey: `history:${identity}`,
        studentId,
        student: studentId ? group.student || match.student : null,
        excluded,
        rowKeys: [],
        sources: [],
        attendanceCells: 0,
        candidatesById: new Map(),
        isMatchHistory: Boolean(studentId || excluded),
      });
      const history = group.historyByIdentity.get(identity);
      history.studentId = studentId;
      history.student = studentId ? group.student || match.student : null;
      history.excluded = excluded;
      history.isMatchHistory = Boolean(studentId || excluded);
      history.rowKeys.push(match.rowKey);
      history.sources.push({ sheet: match.sourceSheet, row: match.rowNumber, name: match.name });
      history.attendanceCells += Number(match.attendanceCells || 0);
      for (const candidate of match.candidates || []) history.candidatesById.set(candidate._id, candidate);
    }
  }
  return Array.from(groups.values(), ({ names, candidatesById, historyByIdentity, ...group }) => ({
    ...group, name: Array.from(names).filter(Boolean).join(" / "),
    candidates: Array.from(candidatesById.values()),
    historyItems: Array.from(historyByIdentity.values(), ({ candidatesById: historyCandidates, ...history }) => ({
      ...history,
      candidates: Array.from(historyCandidates.values()),
    })),
  }));
}

export function getAttendanceUnmatchedHistory(groups = []) {
  return groups.flatMap((group) => group.historyItems?.length
    ? group.historyItems
    : !group.studentId ? [{ ...group, isMatchHistory: Boolean(group.excluded) }] : []);
}

// Build history from original preview rows, not optional metadata on regrouped
// matched students. This remains stable as multiple identities map to one ID.
export function buildAttendanceUnmatchedHistory(matches = [], resolutions = {}) {
  const history = new Map();
  for (const match of matches) {
    if (match.status === "matched") continue;
    const selected = resolutions[match.rowKey] || "";
    const excluded = selected === "__skip__" || (!selected && match.status === "excluded");
    const studentId = selected === "__skip__" ? "" : selected;
    const identity = JSON.stringify([
      normalize(match.name) || match.rowKey,
      String(match.phone || "").replace(/\D/g, ""),
      normalize(match.admissionNumber),
      studentId, excluded,
    ]);
    if (!history.has(identity)) history.set(identity, {
      ...match, groupKey: `history:${identity}`, studentId, excluded,
      isMatchHistory: Boolean(studentId || excluded),
      rowKeys: [], sources: [], attendanceCells: 0, candidateMap: new Map(),
    });
    const group = history.get(identity);
    group.rowKeys.push(match.rowKey);
    group.sources.push({ sheet: match.sourceSheet, row: match.rowNumber, name: match.name });
    group.attendanceCells += Number(match.attendanceCells || 0);
    for (const candidate of match.candidates || []) group.candidateMap.set(candidate._id, candidate);
  }
  return Array.from(history.values(), ({ candidateMap, ...group }) => ({
    ...group, candidates: Array.from(candidateMap.values()),
  }));
}

export function resolveAttendanceGroup(current, group, studentId) {
  const next = { ...current };
  for (const key of group.rowKeys) next[key] = studentId;
  return next;
}
