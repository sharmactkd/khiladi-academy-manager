import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,

  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  REFRESH_TOKEN_COOKIE_NAME:
    process.env.REFRESH_TOKEN_COOKIE_NAME || "khiladi_refresh_token",

  MAX_REFRESH_SESSIONS: Number(process.env.MAX_REFRESH_SESSIONS) || 5,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM:
    process.env.MAIL_FROM ||
    "KHILADI Academy Manager <noreply@khiladi.com>",

  FRONTEND_RESET_PASSWORD_URL:
    process.env.FRONTEND_RESET_PASSWORD_URL ||
    "http://localhost:5173/reset-password",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  GST_PERCENTAGE: Number(process.env.GST_PERCENTAGE) || 18,
  BILLING_GRACE_DAYS: Number(process.env.BILLING_GRACE_DAYS) || 7,

  isProduction: process.env.NODE_ENV === "production",
};

export default env;