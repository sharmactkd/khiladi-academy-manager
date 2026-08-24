import crypto from "crypto";
import Razorpay from "razorpay";
import env from "../config/env.js";

const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export const isRazorpayConfigured = () => {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
};

export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  const client = getRazorpayClient();

  if (!client) {
    throw new Error("Razorpay is not configured");
  }

  return client.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt,
    notes,
  });
};

export const fetchRazorpayPayment = async (paymentId) => {
  const client = getRazorpayClient();
  if (!client) throw new Error("Razorpay is not configured");
  return client.payments.fetch(paymentId);
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(String(razorpaySignature || ""), "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !rawBody || !signature) return false;
  const expectedHex = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(String(signature), "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};
