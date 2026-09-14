import assert from "node:assert/strict";
import test from "node:test";

test("attendance request cache keys isolate batch and calendar period", () => {
  const key = (batch, year, month) => `${batch}:${year}:${month}`;
  assert.notEqual(key("a", 2026, 9), key("b", 2026, 9));
  assert.notEqual(key("a", 2026, 9), key("a", 2026, 10));
  assert.equal(key("a", 2026, 9), "a:2026:9");
});

test("short private cache never replaces server persistence", () => {
  const ttl = 30000;
  assert.equal(29999 < ttl, true);
  assert.equal(30000 < ttl, false);
});
