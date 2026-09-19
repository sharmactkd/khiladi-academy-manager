import assert from "node:assert/strict";
import { suggest } from "../src/pages/imports/importLogic.js";

const batch = "batch-1";
const item = (overrides = {}) => ({
  name: "Kshitiz Goel",
  phone: "9412255061",
  row: { dateOfBirth: "2008-03-10", ...overrides },
});
const student = (overrides = {}) => ({
  _id: "student-1",
  name: "Kshitiz Goel",
  phone: "9412255061",
  dateOfBirth: "2008-03-10",
  batch,
  status: "active",
  ...overrides,
});

{
  const result = suggest(item(), [student(), student({ _id: "sibling", name: "Kashvi Goel" })], batch);
  assert.equal(result.value, "student-1");
  assert.match(result.reason, /shared phone safely resolved/i);
}

{
  const result = suggest(item({ dateOfBirth: "2009-03-10" }), [student()], batch);
  assert.equal(result.value, "");
  assert.match(result.reason, /DOB differs/i);
}

{
  const result = suggest(item(), [student({ phone: "9999999999" })], batch);
  assert.equal(result.value, "");
  assert.match(result.reason, /phone differs/i);
}

{
  const result = suggest(item(), [student({ batch: "batch-2" })], batch);
  assert.equal(result.value, "");
  assert.match(result.reason, /another batch/i);
}

console.log("Import identity matching tests passed.");
