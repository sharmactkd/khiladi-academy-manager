import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import crypto from "crypto";

import env from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import academyRoutes from "./routes/academyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import studentRoutes from "./routes/studentRoutes.js";
import importSessionRoutes from "./routes/importSessionRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import feePlanRoutes from "./routes/feePlanRoutes.js";
import feePaymentRoutes from "./routes/feePaymentRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";

import beltTestRoutes from "./routes/beltTestRoutes.js";
import championshipRecordRoutes from "./routes/championshipRecordRoutes.js";
import academyEventRoutes from "./routes/academyEventRoutes.js";
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

import branchRoutes from "./routes/branchRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import skillAssessmentRoutes from "./routes/skillAssessmentRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import smartTimelineRoutes from "./routes/smartTimelineRoutes.js";

import tournamentIntegrationRoutes from "./routes/tournamentIntegrationRoutes.js";
import tournamentEntrySyncRoutes from "./routes/tournamentEntrySyncRoutes.js";
import tournamentResultSyncRoutes from "./routes/tournamentResultSyncRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorMiddleware.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { mutationAuditMiddleware } from "./middlewares/mutationAuditMiddleware.js";

const app = express();

app.disable("x-powered-by");
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  res.setHeader("Cache-Control", "no-store");
  next();
});

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

app.set("trust proxy", env.TRUST_PROXY);

app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buffer) => {
      if (
        req.originalUrl?.startsWith("/api/tournament-sync/results/webhook") ||
        req.originalUrl?.startsWith("/api/billing/webhook/razorpay")
      ) {
        req.rawBody = Buffer.from(buffer);
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

if (!env.isProduction) {
  app.use(morgan("dev"));
}


app.use("/uploads/students", (_req, res) => res.status(404).end());
app.use("/uploads/certificate-templates", (_req, res) => res.status(404).end());

app.use(
  "/uploads",
  express.static("uploads", {
    dotfiles: "deny",
    fallthrough: false,
    index: false,
    maxAge: "1d",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "same-site");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src 'self'; sandbox"
      );
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KHILADI Academy Manager API is running",
    data: {
      status: "ok",
    },
  });
});

app.use("/api", apiRateLimiter);
app.use("/api", mutationAuditMiddleware);
app.use("/api/media", mediaRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/branches", branchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/skill-assessments", skillAssessmentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/smart-timeline", smartTimelineRoutes);

app.use("/api/students", studentRoutes);
app.use("/api/import-sessions", importSessionRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fee-plans", feePlanRoutes);
app.use("/api/fee-payments", feePaymentRoutes);
app.use("/api/fees/plans", feePlanRoutes);
app.use("/api/fees", feePaymentRoutes);
app.use("/api/memberships", membershipRoutes);

app.use("/api/belt-tests", beltTestRoutes);
app.use("/api/championship-records", championshipRecordRoutes);
app.use("/api/academy-events", academyEventRoutes);
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

app.use("/api/tournament-integrations", tournamentIntegrationRoutes);
app.use("/api/tournament-sync/entries", tournamentEntrySyncRoutes);
app.use("/api/tournament-sync/results", tournamentResultSyncRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
