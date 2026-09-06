import CommunicationLog from "../models/CommunicationLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

export const getCommunicationLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
  };

  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === "assistant_coach") {
    filter.type = { $ne: "fee_reminder" };
  }

  const [logs, total] = await Promise.all([
    CommunicationLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("recipientUser", "name email phone role")
      .populate("relatedStudent", "name studentCode"),
    CommunicationLog.countDocuments(filter),
  ]);

  return successResponse(res, "Communication logs fetched successfully", {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const createManualCommunicationLog = asyncHandler(async (req, res) => {
  const message = String(req.body.message || "").trim();
  const to = String(req.body.to || "").trim();
  if (!message || !to) return res.status(400).json({ success: false, message: "Recipient and message are required" });
  const allowedTypes = new Set(["announcement", "fee_reminder", "attendance_alert", "belt_test", "championship", "system"]);
  const type = allowedTypes.has(req.body.type) ? req.body.type : "announcement";
  const log = await CommunicationLog.create({
    academy: req.academyId,
    channel: "whatsapp",
    type,
    to,
    message,
    status: "sent",
    provider: "whatsapp_manual",
    metadata: { ...(req.body.metadata || {}), deliveryConfirmed: false, manuallyMarked: true },
    createdBy: req.user._id,
    sentAt: new Date(),
  });
  return successResponse(res, "Manual WhatsApp send recorded", { log }, 201);
});
