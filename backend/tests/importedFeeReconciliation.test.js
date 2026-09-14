import assert from "node:assert/strict";
import test from "node:test";

import { parseImportedFeeBalance } from "../src/utils/importedFee.js";

test("historical fee duration parser supports day-only and mixed labels", () => {
  assert.deepEqual(parseImportedFeeBalance("10D Due"), { months: 0, days: 10 });
  assert.deepEqual(parseImportedFeeBalance("7M, 10D DUE"), { months: 7, days: 10 });
  assert.deepEqual(parseImportedFeeBalance("2 months 20 days due"), { months: 2, days: 20 });
});

test("historical fee duration parser clamps unsafe values", () => {
  assert.deepEqual(parseImportedFeeBalance("999M, 99D due"), { months: 120, days: 29 });
  assert.deepEqual(parseImportedFeeBalance("Paid"), { months: 0, days: 0 });
});
