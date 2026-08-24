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

if (process.env.NODE_ENV === "production") {
  ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"].forEach((key) => {
    if (String(process.env[key]).length < 32) {
      throw new Error(`${key} must contain at least 32 characters in production`);
    }
  });

  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT access and refresh secrets must be different");
  }
}

const integrationEncryptionKey =
  process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_REFRESH_SECRET;
const dataEncryptionKey =
  process.env.DATA_ENCRYPTION_KEY || process.env.JWT_REFRESH_SECRET;
const auditLogSigningKey =
  process.env.AUDIT_LOG_SIGNING_KEY || process.env.JWT_ACCESS_SECRET;

if (process.env.NODE_ENV === "production" && !process.env.INTEGRATION_ENCRYPTION_KEY) {
  throw new Error("Missing required environment variable: INTEGRATION_ENCRYPTION_KEY");
}
if (process.env.NODE_ENV === "production" && !process.env.DATA_ENCRYPTION_KEY) {
  throw new Error("Missing required environment variable: DATA_ENCRYPTION_KEY");
}
if (process.env.NODE_ENV === "production" && !process.env.AUDIT_LOG_SIGNING_KEY) {
  throw new Error("Missing required environment variable: AUDIT_LOG_SIGNING_KEY");
}

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
  REQUIRE_EMAIL_VERIFICATION:
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" ||
    process.env.NODE_ENV === "production",
  EMAIL_VERIFICATION_EXPIRES_MINUTES:
    Number(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES) || 30,
  MAX_FAILED_LOGIN_ATTEMPTS:
    Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
  LOGIN_LOCK_MINUTES: Number(process.env.LOGIN_LOCK_MINUTES) || 15,
  INTEGRATION_ENCRYPTION_KEY: integrationEncryptionKey,
  DATA_ENCRYPTION_KEY: dataEncryptionKey,
  AUDIT_LOG_SIGNING_KEY: auditLogSigningKey,
  AUDIT_LOG_RETENTION_DAYS:
    Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 365,
  TOURNAMENT_API_ALLOWED_ORIGINS: String(
    process.env.TOURNAMENT_API_ALLOWED_ORIGINS ||
      (process.env.NODE_ENV === "production"
        ? "https://khiladi-khoj.com"
        : "http://localhost:5173,http://localhost:5001")
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  TRUST_PROXY:
    process.env.TRUST_PROXY === "true"
      ? 1
      : process.env.TRUST_PROXY === "false" || !process.env.TRUST_PROXY
        ? false
        : process.env.TRUST_PROXY,

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
  FRONTEND_VERIFY_EMAIL_URL:
    process.env.FRONTEND_VERIFY_EMAIL_URL ||
    "http://localhost:5173/verify-email",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  GST_PERCENTAGE: Number(process.env.GST_PERCENTAGE) || 18,
  BILLING_GRACE_DAYS: Number(process.env.BILLING_GRACE_DAYS) || 7,

  isProduction: process.env.NODE_ENV === "production",
};

export default env;
