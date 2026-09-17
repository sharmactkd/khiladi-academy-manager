import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import { verifyRecentAuditIntegrity } from "../src/services/auditMonitoringService.js";

try {
  await connectDB();
  const result = await verifyRecentAuditIntegrity({ limit: Number(process.env.AUDIT_VERIFY_LIMIT) || 5000 });
  console.log(JSON.stringify(result, null, 2));
  if (result.invalid) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
