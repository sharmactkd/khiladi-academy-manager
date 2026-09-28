import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync(new URL("../src/controllers/branchController.js", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/routes/branchRoutes.js", import.meta.url), "utf8");

test("first branch is not blocked by the multiBranch route feature", () => {
  assert.doesNotMatch(routes, /requireFeature\("multiBranch"\)/);
  assert.match(controller, /activeBranchCount >= Number\(branchLimit \|\| 1\)/);
  assert.match(controller, /activeBranchCount === 0\) payload\.isMainBranch = true/);
});

test("additional branches retain an explicit plan check", () => {
  assert.match(controller, /getPlanLimit\(\{ academyId, resourceName: "branches" \}\)/);
  assert.match(controller, /Add an Additional Branch subscription/);
});
