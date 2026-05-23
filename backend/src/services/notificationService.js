import Notification from "../models/Notification.js";

export const createNotification = async ({
  academy,
  recipientUser,
  relatedStudent = null,
  title,
  message,
  type = "system",
  sourceModule = "",
  sourceId = null,
  createdBy = null,
}) => {
  if (!academy || !recipientUser || !title || !message) {
    return null;
  }

  return Notification.create({
    academy,
    recipientUser,
    relatedStudent,
    title,
    message,
    type,
    sourceModule,
    sourceId,
    createdBy,
  });
};

export const createBulkNotifications = async ({
  academy,
  recipients = [],
  title,
  message,
  type = "system",
  sourceModule = "",
  sourceId = null,
  createdBy = null,
}) => {
  if (!academy || !recipients.length || !title || !message) {
    return [];
  }

  const uniqueRecipients = new Map();

  recipients.forEach((item) => {
    const recipientId = String(item.recipientUser || item.user || item._id || "");

    if (!recipientId) return;

    uniqueRecipients.set(recipientId, {
      academy,
      recipientUser: recipientId,
      relatedStudent: item.relatedStudent || item.student || null,
      title,
      message,
      type,
      sourceModule,
      sourceId,
      createdBy,
    });
  });

  const payload = Array.from(uniqueRecipients.values());

  if (!payload.length) return [];

  return Notification.insertMany(payload, { ordered: false });
};