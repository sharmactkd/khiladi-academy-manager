import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = fs.readFileSync(new URL("../src/routes/importSessionRoutes.js", import.meta.url), "utf8");

test("import sessions require workbook identity, destination and reviewed decisions", () => {
  assert.match(routes, /\^\[a-f0-9\]\{64\}\$/);
  assert.match(routes, /plan\.branch/);
  assert.match(routes, /plan\.batch/);
  assert.match(routes, /plan\.decisions/);
  assert.match(routes, /plan\.sheetRoles/);
});
