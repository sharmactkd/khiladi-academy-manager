import StudentGuardian from "../models/StudentGuardian.js";
import FeePayment from "../models/FeePayment.js";
import Attendance from "../models/Attendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { createNotification } from "../services/notificationService.js";
import {
  createInternalCommunicationLog,
  sendEmailCommunication,
  sendWhatsAppCommunication,
} from "../services/communicationService.js";

const normalizeChannels = (channels) => {
  if (!Array.isArray(channels) || !channels.length) return ["internal"];
  return channels;
};

const sendToGuardian = async ({
  academy,
  guardian,
  student,
  title,
  message,
  type,
  channels,
  createdBy,
}) => {
  const logs = [];

  if (channels.includes("internal")) {
    await createNotification({
      academy,
      recipientUser: guardian._id,
      relatedStudent: student._id,
      title,
      message,
      type: type === "fee_reminder" ? "fee_reminder" : "attendance",
      sourceModule: type,
      createdBy,
    });

    logs.push(
      await createInternalCommunicationLog({
        academy,
        recipientUser: guardian._id,
        relatedStudent: student._id,
        subject: title,
        message,
        type,
        createdBy,
      })
    );
  }

  if (channels.includes("email")) {
    logs.push(
      await sendEmailCommunication({
        academy,
        recipientUser: guardian._id,
        relatedStudent: student._id,
        to: guardian.email,
        subject: title,
        message,
        type,
        createdBy,
      })
    );
  }

  if (channels.includes("whatsapp")) {
    logs.push(
      await sendWhatsAppCommunication({
        academy,
        recipientUser: guardian._id,
        relatedStudent: student._id,
        to: guardian.phone,
        message,
        type,
        createdBy,
      })
    );
  }

  return logs;
};

export const sendFeeReminder = asyncHandler(async (req, res) => {
  const channels = normalizeChannels(req.body.channels);

  const filter = {
    academy: req.academyId,
    status: { $in: ["pending", "overdue", "partial"] },
  };

  if (Array.isArray(req.body.studentIds) && req.body.studentIds.length) {
    filter.student = { $in: req.body.studentIds };
  }

  const payments = await FeePayment.find(filter)
    .populate("student", "name studentCode")
    .sort({ dueDate: 1, createdAt: -1 });

  const studentIds = [...new Set(payments.map((payment) => String(payment.student._id)))];

  const links = await StudentGuardian.find({
    academy: req.academyId,
    student: { $in: studentIds },
    isActive: true,
    canViewFees: true,
  }).populate("guardianUser", "name email phone role");

  const logs = [];

  for (const payment of payments) {
    const relatedLinks = links.filter(
      (link) => String(link.student) === String(payment.student._id)
    );

    for (const link of relatedLinks) {
      const message =
        req.body.message ||
        `Fee reminder for ${payment.student.name}. Month: ${payment.month}, Amount: ₹${payment.finalAmount}, Status: ${payment.status}.`;

      const resultLogs = await sendToGuardian({
        academy: req.academyId,
        guardian: link.guardianUser,
        student: payment.student,
        title: "Fee Reminder",
        message,
        type: "fee_reminder",
        channels,
        createdBy: req.user._id,
      });

      logs.push(...resultLogs);
    }
  }

  return successResponse(res, "Fee reminders processed successfully", {
    paymentsCount: payments.length,
    logsCount: logs.length,
    logs,
  });
});

export const sendAttendanceReminder = asyncHandler(async (req, res) => {
  const channels = normalizeChannels(req.body.channels);
  const targetDate = new Date(req.body.date);

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const filter = {
    academy: req.academyId,
    date: { $gte: start, $lte: end },
  };

  if (req.body.batch) filter.batch = req.body.batch;

  const attendanceSheets = await Attendance.find(filter)
    .populate("records.student", "name studentCode")
    .populate("batch", "batchName");

  const absentStudents = [];

  attendanceSheets.forEach((sheet) => {
    sheet.records.forEach((record) => {
      if (record.status === "absent") {
        absentStudents.push({
          student: record.student,
          batch: sheet.batch,
          date: sheet.date,
        });
      }
    });
  });

  const studentIds = absentStudents.map((item) => item.student._id);

  const links = await StudentGuardian.find({
    academy: req.academyId,
    student: { $in: studentIds },
    isActive: true,
    canViewAttendance: true,
  }).populate("guardianUser", "name email phone role");

  const logs = [];

  for (const item of absentStudents) {
    const relatedLinks = links.filter(
      (link) => String(link.student) === String(item.student._id)
    );

    for (const link of relatedLinks) {
      const message =
        req.body.message ||
        `${item.student.name} was marked absent on ${new Date(item.date).toLocaleDateString()}. Batch: ${item.batch?.batchName || "-"}.`;

      const resultLogs = await sendToGuardian({
        academy: req.academyId,
        guardian: link.guardianUser,
        student: item.student,
        title: "Attendance Alert",
        message,
        type: "attendance_alert",
        channels,
        createdBy: req.user._id,
      });

      logs.push(...resultLogs);
    }
  }

  return successResponse(res, "Attendance reminders processed successfully", {
    absentCount: absentStudents.length,
    logsCount: logs.length,
    logs,
  });
});