import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import { IMAGE_UPLOAD_PROFILES, imageProfileForField, optimizeUploadedImage } from "../../src/utils/imageOptimization.js";

test("upload fields receive purpose-specific image profiles", () => {
  assert.equal(imageProfileForField("profilePhoto"), IMAGE_UPLOAD_PROFILES.profilePhoto);
  assert.equal(imageProfileForField("certificateBackground"), IMAGE_UPLOAD_PROFILES.certificateBackground);
  assert.equal(imageProfileForField("frontBackground"), IMAGE_UPLOAD_PROFILES.idCardBackground);
  assert.equal(imageProfileForField("signature3"), IMAGE_UPLOAD_PROFILES.signature);
});

test("profile photos are resized and encoded as webp", async () => {
  const input = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: "#b51f2e" } }).png().toBuffer();
  const result = await optimizeUploadedImage(input, "profilePhoto");
  const metadata = await sharp(result.buffer).metadata();
  assert.equal(result.mimeType, "image/webp");
  assert.ok(metadata.width <= 512);
  assert.ok(metadata.height <= 512);
  assert.ok(result.optimizedBytes < result.originalBytes);
});

test("print backgrounds retain higher resolution than profile photos", () => {
  assert.ok(IMAGE_UPLOAD_PROFILES.certificateBackground.width >= 3508);
  assert.ok(IMAGE_UPLOAD_PROFILES.certificateBackground.targetBytes > IMAGE_UPLOAD_PROFILES.idCardBackground.targetBytes);
  assert.ok(IMAGE_UPLOAD_PROFILES.idCardBackground.targetBytes > IMAGE_UPLOAD_PROFILES.profilePhoto.targetBytes);
});
