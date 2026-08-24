import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.MONGO_URI ||= "mongodb://127.0.0.1/security-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-at-least-32-characters";
process.env.DATA_ENCRYPTION_KEY ||= "test-data-key-at-least-32-characters";
process.env.INTEGRATION_ENCRYPTION_KEY ||= "test-integration-key-at-least-32-chars";
process.env.AUDIT_LOG_SIGNING_KEY ||= "test-audit-key-at-least-32-characters";
process.env.PRIVATE_MEDIA_SIGNING_KEY ||= "test-private-media-key-at-least-32-chars";
process.env.RAZORPAY_KEY_SECRET ||= "razorpay-test-secret";

const fields = await import("../../src/utils/fieldEncryption.js");
const integrations = await import("../../src/utils/integrationSecurity.js");
const search = await import("../../src/utils/search.js");
const mfa = await import("../../src/utils/mfa.js");
const privateMedia = await import("../../src/utils/privateMedia.js");
const razorpay = await import("../../src/services/razorpayService.js");

test("sensitive values use authenticated encryption and round-trip", () => {
  const plain = "123456789012";
  const encrypted = fields.encryptSensitiveValue(plain);
  assert.notEqual(encrypted, plain);
  assert.match(encrypted, /^v1\./);
  assert.equal(fields.decryptSensitiveValue(encrypted), plain);
  assert.equal(fields.hashSensitiveValue(plain), fields.hashSensitiveValue(plain));
});

test("integration secrets are encrypted and authenticated", () => {
  const plain = "webhook-secret";
  const encrypted = integrations.encryptIntegrationSecret(plain);
  assert.notEqual(encrypted, plain);
  assert.equal(integrations.decryptIntegrationSecret(encrypted), plain);
  assert.throws(() => integrations.decryptIntegrationSecret(`${encrypted}tampered`));
});

test("tournament API allowlist rejects foreign and credential URLs", () => {
  assert.match(
    integrations.assertAllowedTournamentApiUrl("http://localhost:5001/api/"),
    /^http:\/\/localhost:5001/
  );
  assert.throws(() => integrations.assertAllowedTournamentApiUrl("https://example.com"));
  assert.throws(() => integrations.assertAllowedTournamentApiUrl("http://user:pass@localhost:5001"));
});

test("search input is escaped instead of executed as a regular expression", () => {
  const regex = search.buildSafeSearchRegex("(a+)+$.*");
  assert.equal(regex.test("(a+)+$.*"), true);
  assert.equal(regex.test("aaaaaaaa"), false);
});

test("MFA setup produces a valid secret URI and one-way recovery hashes", () => {
  const secret = mfa.createMfaSecret();
  assert.match(secret, /^[A-Z2-7]+$/);
  assert.match(mfa.createMfaUri({ secret, email: "owner@example.com" }), /^otpauth:\/\/totp\//);
  const codes = mfa.createRecoveryCodes(3);
  assert.equal(new Set(codes).size, 3);
  assert.notEqual(mfa.hashRecoveryCode(codes[0]), codes[0]);
});

test("private media URLs are short-lived, signed and traversal-safe", () => {
  const filePath = "private-uploads/students/123e4567-e89b-12d3-a456-426614174000.png";
  const signedUrl = privateMedia.createSignedPrivateMediaUrl(filePath);
  const parsed = new URL(signedUrl, "http://localhost");
  const encodedPath = parsed.pathname.split("/").at(-1);
  assert.equal(
    privateMedia.verifySignedPrivateMediaRequest({
      encodedPath,
      expires: parsed.searchParams.get("expires"),
      signature: parsed.searchParams.get("signature"),
    }),
    filePath
  );
  assert.equal(
    privateMedia.verifySignedPrivateMediaRequest({
      encodedPath,
      expires: parsed.searchParams.get("expires"),
      signature: `${parsed.searchParams.get("signature")}x`,
    }),
    null
  );
  assert.throws(() =>
    privateMedia.createSignedPrivateMediaUrl(
      "private-uploads/students/../123e4567-e89b-12d3-a456-426614174000.png"
    )
  );
});

test("Razorpay callback signatures use timing-safe verification", () => {
  const orderId = "order_test";
  const paymentId = "pay_test";
  const callbackSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  assert.equal(
    razorpay.verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: callbackSignature,
    }),
    true
  );
  assert.equal(
    razorpay.verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: `${callbackSignature[0] === "0" ? "1" : "0"}${callbackSignature.slice(1)}`,
    }),
    false
  );
});
