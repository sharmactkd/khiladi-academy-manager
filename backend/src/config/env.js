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

  isProduction: process.env.NODE_ENV === "production",
};

export default env;