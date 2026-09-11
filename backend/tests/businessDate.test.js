import assert from "node:assert/strict";
import test from "node:test";

import { isDueOnOrBeforeToday, todayDateKey } from "../src/utils/businessDate.js";

test("academy business date uses India date across UTC midnight boundary", () => {
  const instant = new Date("2026-09-09T19:15:00.000Z");
  assert.equal(todayDateKey(instant), "2026-09-10");
  assert.equal(isDueOnOrBeforeToday("2026-09-10", instant), true);
});

test("future due dates do not become overdue", () => {
  const instant = new Date("2026-09-10T06:00:00.000Z");
  assert.equal(isDueOnOrBeforeToday("2026-09-11", instant), false);
});
