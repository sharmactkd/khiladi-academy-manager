// Use all review groups, never only the visible/search-filtered table page.
export function linkedAttendanceStudentIds(groups = []) {
  return new Set(groups.filter((group) => group.studentId && !group.excluded)
    .map((group) => String(group.studentId)));
}

export function attendanceStudentChoices({ options = [], candidates = [], selectedStudent, selectedId = "", linkedIds = new Set() }) {
  const choices = new Map();
  for (const student of [selectedStudent, ...options, ...candidates]) {
    if (!student?._id) continue;
    const id = String(student._id);
    if (linkedIds.has(id) && id !== String(selectedId)) continue;
    if (!choices.has(id)) choices.set(id, student);
  }
  return [...choices.values()];
}
