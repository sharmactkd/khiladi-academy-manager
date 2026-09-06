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
import { buildSafeSearchRegex } from "../utils/search.js";

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

const getAnnouncementAccessContext = async (user) => {
  // Parent accounts are linked to students through StudentGuardian. Student
  // accounts currently have no verified User -> Student mapping, so granting
  // student access here would be an IDOR. Keep it denied until such a link exists.
  if (user.role !== "parent") {
    return { academyIds: [], studentIds: [], batchIds: [] };
  }

  const links = await StudentGuardian.find({
    guardianUser: user._id,
    isActive: true,
  }).populate("student", "batch");

  return {
    academyIds: [...new Set(links.map((link) => String(link.academy)))],
    studentIds: links.map((link) => link.student?._id || link.student).filter(Boolean),
    batchIds: links.map((link) => link.student?.batch).filter(Boolean),
  };
};

const buildMyAnnouncementFilter = ({ user, context, id = null }) => ({
  ...(id ? { _id: id } : {}),
  academy: { $in: context.academyIds },
  status: "published",
  publishAt: { $lte: new Date() },
  $and: [
    { $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] },
    {
      $or: [
        { audienceType: "all" },
        { audienceType: user.role === "parent" ? "parents" : "students" },
        { audienceType: "batch", batch: { $in: context.batchIds } },
        { audienceType: "individual", students: { $in: context.studentIds } },
        { audienceType: "individual", guardianUsers: user._id },
      ],
    },
  ],
});

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
    const searchRegex = buildSafeSearchRegex(req.query.search);
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

  const context = await getAnnouncementAccessContext(req.user);
  const announcements = await Announcement.find(
    buildMyAnnouncementFilter({ user: req.user, context })
  ).sort({ publishAt: -1, createdAt: -1 });

  return successResponse(res, "My announcements fetched successfully", {
    announcements,
  });
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  if (["parent", "student"].includes(req.user.role)) {
    const context = await getAnnouncementAccessContext(req.user);
    Object.assign(
      filter,
      buildMyAnnouncementFilter({
        user: req.user,
        context,
        id: req.params.id,
      })
    );
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
