import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [auth, academyApi, batchApi, attendanceService, feePayment] = await Promise.all([
  read("../src/context/AuthContext.jsx"),
  read("../src/api/academyApi.js"),
  read("../src/api/batchApi.js"),
  read("../../backend/src/services/monthlyAttendanceService.js"),
  read("../../backend/src/models/FeePayment.js"),
]);

assert.match(auth, /if \(isPublicBoot\)[\s\S]*setLoading\(false\)/, "public and login pages must render before a refresh request finishes");
assert.match(auth, /import\("\.\.\/pages\/attendance\/Attendance\.jsx"\)/, "attendance route should be warmed after login");
assert.match(academyApi, /cachedRequest\("workspace:academies"/, "academy list requests must be deduplicated");
assert.match(batchApi, /cachedRequest\(`workspace:batches:/, "batch requests must be deduplicated");
assert.match(attendanceService, /Attendance\.aggregate\(\[/, "historical fee context must project matching attendance rows only");
assert.match(attendanceService, /\{ \$unwind: "\$records" \}/, "historical attendance arrays must be reduced in MongoDB");
assert.match(feePayment, /student: 1, paymentDate: -1, createdAt: -1/, "latest student fee lookup must have a compound index");

console.log("Performance optimization checks passed");
