import crypto from "crypto";

export const hashSecret = (value) => {
  if (!value) {
    throw new Error("Secret value is required");
  }

  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

export const generateSecureToken = (prefix = "khiladi") => {
  const token = crypto.randomBytes(32).toString("hex");
  return `${prefix}_${token}`;
};

export const createWebhookSignature = (payload, rawSecret) => {
  const body =
    typeof payload === "string" || Buffer.isBuffer(payload)
      ? payload
      : JSON.stringify(payload || {});

  return crypto.createHmac("sha256", rawSecret).update(body).digest("hex");
};

export const verifyWebhookSignature = ({ payload, signature, rawSecret }) => {
  if (!payload || !signature || !rawSecret) {
    return false;
  }

  const expectedSignature = createWebhookSignature(payload, rawSecret);

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(String(signature).trim(), "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};