import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_security_test";
process.env.JWT_ACCESS_SECRET ||= "phase-four-access-secret-with-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "phase-four-refresh-secret-with-at-least-32-characters";
process.env.DATA_ENCRYPTION_KEY ||= "phase-four-primary-data-key-with-at-least-32-characters";
process.env.DATA_ENCRYPTION_KEY_ID = "2026-09";

test("versioned encryption identifies its active key", async () => {
  const fields = await import(`../../src/utils/fieldEncryption.js?phase4=${Date.now()}`);
  const value = fields.encryptSensitiveValue("sensitive");
  assert.match(value, /^v2\.2026-09\./);
  assert.equal(fields.decryptSensitiveValue(value), "sensitive");
  assert.equal(fields.getSensitiveValueKeyId(value), "2026-09");
});

test("key rotation and retention tools default to dry-run", () => {
  const rotation = fs.readFileSync(new URL("../../scripts/rotateEncryptionKeys.js", import.meta.url), "utf8");
  const retention = fs.readFileSync(new URL("../../scripts/enforceDataRetention.js", import.meta.url), "utf8");
  assert.match(rotation, /process\.argv\.includes\("--apply"\)/);
  assert.match(rotation, /Dry-run only/);
  assert.match(retention, /process\.argv\.includes\("--apply"\)/);
  assert.doesNotMatch(retention, /feepayments|students.*deleteMany/i);
});

test("remote OWASP smoke checks require explicit authorization", () => {
  const smoke = fs.readFileSync(new URL("../../scripts/runOwaspApiSmoke.js", import.meta.url), "utf8");
  assert.match(smoke, /SECURITY_TEST_AUTHORIZED/);
  assert.match(smoke, /hostile CORS origin rejected/);
});

test("phase four operational policies are present", () => {
  for (const file of ["INCIDENT_RESPONSE.md", "DATA_RETENTION_AND_DELETION.md", "ENCRYPTION_KEY_ROTATION.md", "PENETRATION_TEST_SCOPE.md"]) {
    assert.equal(fs.existsSync(new URL(`../../../docs/${file}`, import.meta.url)), true, file);
  }
});
