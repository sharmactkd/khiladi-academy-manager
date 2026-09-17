import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_security_test";
process.env.JWT_ACCESS_SECRET ||= "phase-two-access-secret-with-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "phase-two-refresh-secret-with-at-least-32-characters";
process.env.PRIVATE_MEDIA_SIGNING_KEY ||= "phase-two-private-media-key-with-at-least-32-characters";

const { requireStepUp } = await import("../../src/middlewares/stepUpMiddleware.js");
const { generateStepUpToken } = await import("../../src/utils/generateToken.js");
const { createSignedPrivateMediaUrl, verifySignedPrivateMediaRequest } = await import("../../src/utils/privateMedia.js");

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("step-up token is bound to user and operation", () => {
  const user = { _id: { toString: () => "507f1f77bcf86cd799439011" } };
  const token = generateStepUpToken({ user, operation: "fees:repair" });
  const middleware = requireStepUp("fees:repair");
  let called = false;
  middleware({ user, authIssuedAt: null, get: () => token }, response(), () => { called = true; });
  assert.equal(called, true);
});

test("step-up rejects a token for another operation", () => {
  const user = { _id: { toString: () => "507f1f77bcf86cd799439011" } };
  const token = generateStepUpToken({ user, operation: "fees:repair" });
  const res = response();
  requireStepUp("students:delete-all")({ user, authIssuedAt: null, get: () => token }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test("private media links are bound to viewer IP scope", () => {
  const url = createSignedPrivateMediaUrl("uploads/students/123e4567-e89b-12d3-a456-426614174000.webp", { viewerId: "u1", academyId: "a1", ip: "1.2.3.4" });
  const parsed = new URL(url, "http://local.test");
  const args = { encodedPath: parsed.pathname.split("/").pop(), expires: parsed.searchParams.get("expires"), scope: parsed.searchParams.get("scope"), signature: parsed.searchParams.get("signature") };
  assert.ok(verifySignedPrivateMediaRequest({ ...args, ip: "1.2.3.4" }));
  assert.equal(verifySignedPrivateMediaRequest({ ...args, ip: "5.6.7.8" }), null);
});

test("phase two routes include replay, distributed limiting and step-up controls", () => {
  const auth = fs.readFileSync(new URL("../../src/controllers/authController.js", import.meta.url), "utf8");
  const limiter = fs.readFileSync(new URL("../../src/middlewares/rateLimiter.js", import.meta.url), "utf8");
  const studentRoutes = fs.readFileSync(new URL("../../src/routes/studentRoutes.js", import.meta.url), "utf8");
  assert.match(auth, /REFRESH_TOKEN_REPLAY_DETECTED/);
  assert.match(auth, /findOneAndUpdate/);
  assert.match(limiter, /RedisStore/);
  assert.match(studentRoutes, /requireStepUp\("students:delete-all"\)/);
});

test("public enquiry requires timing and Turnstile verification hooks", () => {
  const source = fs.readFileSync(new URL("../../src/controllers/academyEnquiryController.js", import.meta.url), "utf8");
  assert.match(source, /formStartedAt/);
  assert.match(source, /verifyTurnstile/);
});
