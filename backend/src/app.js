import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import env from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import academyRoutes from "./routes/academyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import studentRoutes from "./routes/studentRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import feePlanRoutes from "./routes/feePlanRoutes.js";
import feePaymentRoutes from "./routes/feePaymentRoutes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (!env.isProduction) {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KHILADI Academy Manager API is running",
    data: {
      status: "ok",
      environment: env.NODE_ENV,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/students", studentRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fee-plans", feePlanRoutes);
app.use("/api/fee-payments", feePaymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;