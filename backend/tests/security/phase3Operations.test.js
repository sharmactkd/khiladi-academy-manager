import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_security_test";
process.env.JWT_ACCESS_SECRET ||= "phase-three-access-secret-with-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "phase-three-refresh-secret-with-at-least-32-characters";
process.env.AUDIT_LOG_SIGNING_KEY ||= "phase-three-audit-signing-key-with-at-least-32-characters";

const { calculateAuditIntegrityHash, verifyAuditIntegrityHash } = await import("../../src/models/AuditLog.js");

test("audit integrity verification detects tampering", () => {
  const log = { user: null, academy: null, action: "TEST", module: "security", ip: "127.0.0.1", userAgent: "test", metadata: { safe: true }, createdAt: new Date("2026-09-17T00:00:00.000Z") };
  log.integrityHash = calculateAuditIntegrityHash(log);
  assert.equal(verifyAuditIntegrityHash(log), true);
  assert.equal(verifyAuditIntegrityHash({ ...log, action: "TAMPERED" }), false);
});

test("CI includes CodeQL, dependency review and secret scanning", () => {
  const codeql = fs.readFileSync(new URL("../../../.github/workflows/codeql.yml", import.meta.url), "utf8");
  const security = fs.readFileSync(new URL("../../../.github/workflows/security.yml", import.meta.url), "utf8");
  const dependabot = fs.readFileSync(new URL("../../../.github/dependabot.yml", import.meta.url), "utf8");
  assert.match(codeql, /security-extended/);
  assert.match(security, /gitleaks/);
  assert.match(security, /dependency-review-action/);
  assert.match(dependabot, /package-ecosystem: npm/);
});

test("frontend deployment config has CSP and HSTS", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../../../frontend/vercel.json", import.meta.url), "utf8"));
  const headers = config.headers.flatMap((item) => item.headers || []);
  assert.ok(headers.some((item) => item.key === "Content-Security-Policy"));
  assert.ok(headers.some((item) => item.key === "Strict-Transport-Security"));
});

test("backup and production readiness scripts refuse unsafe assumptions", () => {
  const backup = fs.readFileSync(new URL("../../scripts/verifyRestoredBackup.js", import.meta.url), "utf8");
  const readiness = fs.readFileSync(new URL("../../scripts/verifyProductionReadiness.js", import.meta.url), "utf8");
  assert.match(backup, /Refusing to test a restore against the production database/);
  assert.match(readiness, /excessive roles/);
});
