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

import beltTestRoutes from "./routes/beltTestRoutes.js";
import championshipRecordRoutes from "./routes/championshipRecordRoutes.js";
import studentTimelineRoutes from "./routes/studentTimelineRoutes.js";
import idCardTemplateRoutes from "./routes/idCardTemplateRoutes.js";
import idCardRoutes from "./routes/idCardRoutes.js";
import certificateTemplateRoutes from "./routes/certificateTemplateRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";

import parentLinkRoutes from "./routes/parentLinkRoutes.js";
import parentPortalRoutes from "./routes/parentPortalRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import communicationLogRoutes from "./routes/communicationLogRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";

import planRoutes from "./routes/planRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import adminGrantRoutes from "./routes/adminGrantRoutes.js";

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

app.use("/api/belt-tests", beltTestRoutes);
app.use("/api/championship-records", championshipRecordRoutes);
app.use("/api/student-timeline", studentTimelineRoutes);
app.use("/api/id-card-templates", idCardTemplateRoutes);
app.use("/api/id-cards", idCardRoutes);
app.use("/api/certificate-templates", certificateTemplateRoutes);
app.use("/api/certificates", certificateRoutes);

app.use("/api/parent-links", parentLinkRoutes);
app.use("/api/parent-portal", parentPortalRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/communication-logs", communicationLogRoutes);
app.use("/api/reminders", reminderRoutes);

app.use("/api/plans", planRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/grants", adminGrantRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;