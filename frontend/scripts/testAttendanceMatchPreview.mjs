import assert from "node:assert/strict";
import test from "node:test";
import { prepareMatchPreview } from "../src/utils/attendanceMatchPreview.js";

const row = (overrides = {}) => ({
  sourceSheet: "2025 Attendance", importedRowNumber: 10,
  name: "Student One", phone: "9999999999", batchName: "Evening",
  attendance: [{ date: "2025-01-01", status: "present" }],
  ...overrides,
});

test("repeated monthly identity is previewed once without attendance data", async () => {
  const result = await prepareMatchPreview([
    { rows: [row()] }, { rows: [row()] },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].cells, 2);
  assert.equal(result[0].row.attendance, undefined);
  assert.equal(result[0].row.importedRowNumber, 10);
});

test("siblings, separate source rows, batches and sheets remain separate", async () => {
  const rows = [
    row(), row({ name: "Sibling" }), row({ importedRowNumber: 11 }),
    row({ sourceSheet: "2026 Attendance" }), row({ batchName: "Morning" }),
  ];
  assert.equal((await prepareMatchPreview([{ rows }])).length, 5);
});

test("missing row number gets a stable source position", async () => {
  const result = await prepareMatchPreview([{ rows: [row({ importedRowNumber: undefined })] }]);
  assert.equal(result[0].row.importedRowNumber, 2);
});

test("large preview yields to event loop and substantially reduces transport", async () => {
  const rows = Array.from({ length: 1500 }, (_, index) => row({
    importedRowNumber: index + 2,
    attendance: Array.from({ length: 31 }, () => ({ date: "2025-01-01", status: "present" })),
  }));
  const blocks = Array.from({ length: 24 }, () => ({ rows }));
  let progressCalls = 0;
  let yielded = false;
  setTimeout(() => { yielded = true; }, 0);
  const result = await prepareMatchPreview(blocks, () => { progressCalls += 1; });
  assert.ok(yielded);
  assert.equal(progressCalls, 72);
  assert.equal(result.length, 1500);
  assert.equal(result.reduce((sum, entry) => sum + entry.cells, 0), 36000 * 31);
  assert.ok(JSON.stringify(result).length < JSON.stringify(rows).length / 5);
});
