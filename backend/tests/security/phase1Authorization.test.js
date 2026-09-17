import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

process.env.MONGO_URI ||= "mongodb://127.0.0.1/security-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-at-least-32-characters";
process.env.DATA_ENCRYPTION_KEY ||= "test-data-key-at-least-32-characters";
process.env.INTEGRATION_ENCRYPTION_KEY ||= "test-integration-key-at-least-32-chars";
process.env.AUDIT_LOG_SIGNING_KEY ||= "test-audit-key-at-least-32-characters";
process.env.PRIVATE_MEDIA_SIGNING_KEY ||= "test-private-media-key-at-least-32-chars";

const { requireAcademyOwner } = await import("../../src/middlewares/roleMiddleware.js");
const { default: User } = await import("../../src/models/User.js");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("owner-only middleware denies assistant coaches", () => {
  const res = response();
  let continued = false;
  requireAcademyOwner({ user: { role: "assistant_coach" } }, res, () => { continued = true; });
  assert.equal(continued, false);
  assert.equal(res.statusCode, 403);
});

test("owner-only middleware allows academy owners and super admins", () => {
  for (const role of ["academy_owner", "super_admin"]) {
    const res = response();
    let continued = false;
    requireAcademyOwner({ user: { role } }, res, () => { continued = true; });
    assert.equal(continued, true);
    assert.equal(res.statusCode, 200);
  }
});

test("pending MFA setup is encrypted, private and expiring", () => {
  const secretPath = User.schema.path("pendingMfaSecret");
  const expiryPath = User.schema.path("pendingMfaExpires");
  assert.equal(secretPath.options.select, false);
  assert.equal(expiryPath.options.select, false);
  const user = new User({
    name: "Security Test",
    email: "security@example.com",
    password: "Example#123",
    pendingMfaSecret: "JBSWY3DPEHPK3PXP",
  });
  assert.notEqual(user.get("pendingMfaSecret", null, { getters: false }), "JBSWY3DPEHPK3PXP");
  assert.equal(user.pendingMfaSecret, "JBSWY3DPEHPK3PXP");
});

test("protected-request lookup does not select the password hash", () => {
  const source = fs.readFileSync(new URL("../../src/middlewares/authMiddleware.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /select\(["']\+password["']\)/);
  assert.match(source, /authInvalidBefore/);
});

test("destructive and import routes require academy-owner authorization", () => {
  const studentRoutes = fs.readFileSync(new URL("../../src/routes/studentRoutes.js", import.meta.url), "utf8");
  const attendanceRoutes = fs.readFileSync(new URL("../../src/routes/attendanceRoutes.js", import.meta.url), "utf8");
  assert.match(studentRoutes, /"\/import",\s*requireAcademyOwner/);
  assert.match(studentRoutes, /"\/bulk\/status",\s*requireAcademyOwner/);
  assert.match(studentRoutes, /"\/bulk\/all",\s*requireAcademyOwner/);
  assert.match(studentRoutes, /\.delete\(requireAcademyOwner/);
  assert.match(attendanceRoutes, /"\/import\/preview",\s*requireAcademyOwner/);
  assert.match(attendanceRoutes, /"\/imported-fees\/preview", requireAcademyOwner/);
  assert.match(attendanceRoutes, /"\/imported-fees\/apply",\s*requireAcademyOwner/);
  assert.match(attendanceRoutes, /"\/import",\s*requireAcademyOwner/);
});

test("assistant attendance routes enforce assigned-branch scope", () => {
  const routes = fs.readFileSync(new URL("../../src/routes/attendanceRoutes.js", import.meta.url), "utf8");
  const middleware = fs.readFileSync(
    new URL("../../src/middlewares/assistantAttendanceScopeMiddleware.js", import.meta.url),
    "utf8"
  );
  assert.match(routes, /requireAssistantAttendanceScope/);
  assert.match(middleware, /getAssistantCoachBranchIds/);
  assert.match(middleware, /outside your assigned branches/);
  assert.match(middleware, /academy: req\.academyId/);
});
