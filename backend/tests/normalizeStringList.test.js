import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStringList } from "../src/utils/normalizeStringList.js";

test("repairs nested and broken historical martial-art JSON", () => {
  assert.deepEqual(
    normalizeStringList(['[\\"Taekwondo\\"', '\\"Boxing\\"]', "Taekwondo", '"Boxing"']),
    ["Taekwondo", "Boxing"],
  );
});

test("recursively decodes valid JSON and deduplicates case-insensitively", () => {
  assert.deepEqual(
    normalizeStringList('["Taekwondo","boxing"," BOXING "]'),
    ["Taekwondo", "boxing"],
  );
});

test("keeps safe custom names and rejects object fragments", () => {
  assert.deepEqual(
    normalizeStringList(["Brazilian Jiu-Jitsu", "Self Defence / Fitness", "{bad}"]),
    ["Brazilian Jiu-Jitsu", "Self Defence / Fitness"],
  );
});
