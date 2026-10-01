import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [api, auth, env, controller] = await Promise.all([
  read("../src/api/api.js"),
  read("../src/context/AuthContext.jsx"),
  read("../../backend/src/config/env.js"),
  read("../../backend/src/controllers/authController.js"),
]);

assert.match(api, /timeout: 75000/, "refresh must tolerate a free-host cold start");
assert.match(api, /\[401, 403\]\.includes\(refreshError\?\.response\?\.status\)/, "only definitive auth rejection may clear the browser session");
assert.match(auth, /10 \* 60 \* 1000/, "active sessions should refresh before the access token expires");
assert.match(auth, /window\.addEventListener\("online"/, "session refresh should recover when connectivity returns");
assert.match(env, /REFRESH_TOKEN_EXPIRES_IN[^\n]*\|\| "365d"/, "rolling login default must be long lived");
assert.match(controller, /365 \* 24 \* 60 \* 60 \* 1000/, "cookie fallback must match the rolling session lifetime");

console.log("Session continuity checks passed");
