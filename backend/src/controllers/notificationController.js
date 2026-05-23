import Notification from "../models/Notification.js";
import StudentGuardian from "../models/StudentGuardian.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const getUserAcademyIds = async (user) => {
  if (["parent", "student"].includes(user.role)) {
    const links = await StudentGuardian.find({
      guardianUser: user._id,
      isActive: true,
    }).select("academy");

    return links.map((link) => link.academy);
  }

  return [];
};

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    recipientUser: req.user._id,
  };

  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const academyIds = await getUserAcademyIds(req.user);
  if (academyIds.length) filter.academy = { $in: academyIds };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("relatedStudent", "name studentCode"),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      recipientUser: req.user._id,
      isRead: false,
      ...(academyIds.length ? { academy: { $in: academyIds } } : {}),
    }),
  ]);

  return successResponse(res, "Notifications fetched successfully", {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipientUser: req.user._id,
  });

  if (!notification) {
    return errorResponse(res, "Notification not found", 404);
  }

  notification.isRead = true;
  notification.readAt = new Date();

  await notification.save();

  return successResponse(res, "Notification marked as read", { notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      recipientUser: req.user._id,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return successResponse(res, "All notifications marked as read", {
    updated: true,
  });
});