import test from "node:test";
import assert from "node:assert/strict";
import { groupAttendanceReview, resolveAttendanceGroup } from "../src/utils/attendanceReviewGroups.js";

const row = (key, overrides = {}) => ({
  rowKey: key, rowNumber: Number(key) || 5, sourceSheet: "2025 Attendance",
  name: "Prachi Wo", phone: "", admissionNumber: "", status: "unmatched",
  attendanceCells: 23, candidates: [], ...overrides,
});

test("repeated unverified identities are one group but remain unverified", () => {
  const groups = groupAttendanceReview([row("5"), row("55"), row("181")]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].studentId, "");
  assert.deepEqual(groups[0].rowKeys, ["5", "55", "181"]);
  assert.equal(groups[0].attendanceCells, 69);
});

test("confirmed database identity is shown once across different Excel names", () => {
  const student = { _id: "student1", name: "Prachi" };
  const groups = groupAttendanceReview([
    row("5", { status: "matched", student }),
    row("55", { name: "Prachi W/o", status: "matched", student }),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].studentId, student._id);
  assert.equal(groups[0].sources.length, 2);
});

test("different phone, admission or confirmed student IDs stay distinct", () => {
  const groups = groupAttendanceReview([
    row("1", { phone: "111" }), row("2", { phone: "222" }),
    row("3", { admissionNumber: "A1" }), row("4", { admissionNumber: "A2" }),
    row("5", { status: "matched", student: { _id: "s1" } }),
    row("6", { status: "matched", student: { _id: "s2" } }),
  ]);
  assert.equal(groups.length, 6);
});

test("group confirmation preserves every server source key and original data", () => {
  const matches = [row("5"), row("55")];
  const original = JSON.stringify(matches);
  const current = { unrelated: "other" };
  const group = groupAttendanceReview(matches)[0];
  const next = resolveAttendanceGroup(current, group, "student1");
  assert.deepEqual(next, { unrelated: "other", "5": "student1", "55": "student1" });
  assert.deepEqual(current, { unrelated: "other" });
  assert.equal(JSON.stringify(matches), original);
  const reviewed = groupAttendanceReview(matches, next);
  assert.equal(reviewed.length, 1);
  assert.equal(reviewed[0].studentId, "student1");
});

test("excluded groups stay separate from unresolved groups and can be reassigned", () => {
  const matches = [row("5"), row("55")];
  const groups = groupAttendanceReview(matches, { "5": "__skip__" });
  assert.equal(groups.length, 2);
  assert.equal(groups.filter((group) => group.excluded).length, 1);
  const resolution = resolveAttendanceGroup({}, groupAttendanceReview(matches)[0], "__skip__");
  assert.equal(groupAttendanceReview(matches, resolution)[0].excluded, true);
});

test("missing names do not merge unrelated unidentified records", () => {
  assert.equal(groupAttendanceReview([row("5", { name: "" }), row("55", { name: "" })]).length, 2);
});

test("large repeated history preserves cell totals with bounded group count", () => {
  const matches = Array.from({ length: 36000 }, (_, index) =>
    row(String(index), { name: `Student ${index % 1500}` })
  );
  const groups = groupAttendanceReview(matches);
  assert.equal(groups.length, 1500);
  assert.equal(groups.reduce((sum, group) => sum + group.attendanceCells, 0), 36000 * 23);
  assert.equal(groups.reduce((sum, group) => sum + group.rowKeys.length, 0), 36000);
});
