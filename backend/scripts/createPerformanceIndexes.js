import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import Attendance from "../src/models/Attendance.js";
import AttendanceDayNote from "../src/models/AttendanceDayNote.js";
import FeePayment from "../src/models/FeePayment.js";
import Student from "../src/models/Student.js";
import StudentMembership from "../src/models/StudentMembership.js";

const models = [Student, Attendance, AttendanceDayNote, FeePayment, StudentMembership];

let failed = false;
try {
  await connectDB();
  for (const model of models) {
    try {
      await model.createIndexes();
      process.stdout.write(`Indexes ready: ${model.modelName}\n`);
    } catch (error) {
      failed = true;
      process.stderr.write(`Indexes failed: ${model.modelName} — ${error.message}\n`);
    }
  }
  if (failed) {
    throw new Error("One or more index groups failed. No records or existing indexes were deleted.");
  }
  process.stdout.write("Performance indexes created successfully. Existing indexes were not dropped.\n");
} finally {
  await mongoose.disconnect();
}
