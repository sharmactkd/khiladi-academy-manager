import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import academyRoutes from "./routes/academyRoutes.js";
import { apiResponse } from "./utils/apiResponse.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  return apiResponse(res, 200, true, "KHILADI Academy Manager API is running", {
    app: "KHILADI Academy Manager",
    phase: "Phase 1 - Foundation + Auth + Academy",
  });
});

app.get("/api/health", (req, res) => {
  return apiResponse(res, 200, true, "API health check successful", {
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/academies", academyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;