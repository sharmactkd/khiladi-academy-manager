import Announcement from "../models/Announcement.js";
import StudentGuardian from "../models/StudentGuardian.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { resolveAnnouncementAudience } from "../services/announcementAudienceService.js";
import { createBulkNotifications } from "../services/notificationService.js";
import {
  createInternalCommunicationLog,
  sendEmailCommunication,
  sendWhatsAppCommunication,
} from "../services/communicationService.js";

const allowedFields = [
  "title",
  "message",
  "category",
  "audienceType",
  "batch",
  "students",
  "guardianUsers",
  "publishAt",
  "expiresAt",
  "priority",
  "channels",
  "status",
];

const buildPayload = (body) => {
  const payload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });
  return payload;
};

const dispatchAnnouncement = async ({ announcement, userId }) => {
  if (announcement.status !== "published") return;

  const audience = await resolveAnnouncementAudience({ announcement });

  if (announcement.channels.includes("internal")) {
    await createBulkNotifications({
      academy: announcement.academy,
      recipients: audience,
      title: announcement.title,
      message: announcement.message,
      type: "announcement",
      sourceModule: "announcement",
      sourceId: announcement._id,
      createdBy: userId,
    });

    await Promise.all(
      audience.map((item) =>
        createInternalCommunicationLog({
          academy: announcement.academy,
          recipientUser: item.recipientUser,
          relatedStudent: item.relatedStudent,
          subject: announcement.title,
          message: announcement.message,
          type: "announcement",
          metadata: { announcementId: announcement._id },
          createdBy: userId,
        })
      )
    );
  }

  if (announcement.channels.includes("email")) {
    await Promise.all(
      audience.map((item) =>
        sendEmailCommunication({
          academy: announcement.academy,
          recipientUser: item.recipientUser,
          relatedStudent: item.relatedStudent,
          to: item.email,
          subject: announcement.title,
          message: announcement.message,
          type: "announcement",
          metadata: { announcementId: announcement._id },
          createdBy: userId,
        })
      )
    );
  }

  if (announcement.channels.includes("whatsapp")) {
    await Promise.all(
      audience.map((item) =>
        sendWhatsAppCommunication({
          academy: announcement.academy,
          recipientUser: item.recipientUser,
          relatedStudent: item.relatedStudent,
          to: item.phone,
          message: announcement.message,
          type: "announcement",
          metadata: { announcementId: announcement._id },
          createdBy: userId,
        })
      )
    );
  }
};

export const createAnnouncement = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  const announcement = await Announcement.create({
    ...payload,
    academy: req.academyId,
    channels: payload.channels?.length ? payload.channels : ["internal"],
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await dispatchAnnouncement({
    announcement,
    userId: req.user._id,
  });

  return successResponse(res, "Announcement created successfully", { announcement }, 201);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = { academy: req.academyId };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.audienceType) filter.audienceType = req.query.audienceType;
  if (req.query.priority) filter.priority = req.query.priority;

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { message: searchRegex }];
  }

  const announcements = await Announcement.find(filter)
    .sort({ publishAt: -1, createdAt: -1 })
    .populate("batch", "batchName")
    .populate("createdBy", "name email");

  return successResponse(res, "Announcements fetched successfully", {
    announcements,
  });
});

export const getMyAnnouncements = asyncHandler(async (req, res) => {
  if (!["parent", "student"].includes(req.user.role)) {
    return errorResponse(res, "Only parent/student can access my announcements", 403);
  }

  const links = await StudentGuardian.find({
    guardianUser: req.user._id,
    isActive: true,
  }).populate("student", "batch");

  const academyIds = [...new Set(links.map((link) => String(link.academy)))];
  const studentIds = links.map((link) => link.student?._id || link.student);
  const batchIds = links.map((link) => link.student?.batch).filter(Boolean);

  const announcements = await Announcement.find({
    academy: { $in: academyIds },
    status: "published",
    publishAt: { $lte: new Date() },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } },
    ],
    $and: [
      {
        $or: [
          { audienceType: "all" },
          { audienceType: req.user.role === "parent" ? "parents" : "students" },
          { audienceType: "batch", batch: { $in: batchIds } },
          { audienceType: "individual", students: { $in: studentIds } },
          { audienceType: "individual", guardianUsers: req.user._id },
        ],
      },
    ],
  }).sort({ publishAt: -1, createdAt: -1 });

  return successResponse(res, "My announcements fetched successfully", {
    announcements,
  });
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  if (["parent", "student"].includes(req.user.role)) {
    const links = await StudentGuardian.find({
      guardianUser: req.user._id,
      isActive: true,
    }).populate("student", "batch");

    const academyIds = [...new Set(links.map((link) => String(link.academy)))];
    filter.academy = { $in: academyIds };
    filter.status = "published";
  } else {
    filter.academy = req.academyId;
  }

  const announcement = await Announcement.findOne(filter)
    .populate("batch", "batchName")
    .populate("createdBy", "name email");

  if (!announcement) {
    return errorResponse(res, "Announcement not found", 404);
  }

  return successResponse(res, "Announcement fetched successfully", { announcement });
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!announcement) {
    return errorResponse(res, "Announcement not found", 404);
  }

  Object.assign(announcement, buildPayload(req.body), {
    updatedBy: req.user._id,
  });

  await announcement.save();

  return successResponse(res, "Announcement updated successfully", { announcement });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!announcement) {
    return errorResponse(res, "Announcement not found", 404);
  }

  announcement.status = "archived";
  announcement.updatedBy = req.user._id;

  await announcement.save();

  return successResponse(res, "Announcement archived successfully", { announcement });
});