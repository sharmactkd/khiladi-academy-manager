import CommunicationLog from "../models/CommunicationLog.js";
import { sendWhatsAppMessage } from "./whatsappService.js";
import { hasFeature } from "./planService.js";

let emailSender = null;

try {
  const emailModule = await import("./emailService.js");
  emailSender =
    emailModule.sendEmail ||
    emailModule.sendMail ||
    emailModule.default ||
    null;
} catch {
  emailSender = null;
}

export const createCommunicationLog = async ({
  academy,
  recipientUser = null,
  relatedStudent = null,
  channel,
  type = "system",
  to = "",
  subject = "",
  message = "",
  status = "pending",
  provider = "",
  providerMessageId = "",
  errorMessage = "",
  metadata = {},
  createdBy = null,
  sentAt = null,
}) => {
  return CommunicationLog.create({
    academy,
    recipientUser,
    relatedStudent,
    channel,
    type,
    to,
    subject,
    message,
    status,
    provider,
    providerMessageId,
    errorMessage,
    metadata,
    createdBy,
    sentAt,
  });
};

export const sendEmailCommunication = async ({
  academy,
  recipientUser = null,
  relatedStudent = null,
  to,
  subject,
  message,
  type = "system",
  metadata = {},
  createdBy = null,
}) => {
  if (!to) {
    return createCommunicationLog({
      academy,
      recipientUser,
      relatedStudent,
      channel: "email",
      type,
      to,
      subject,
      message,
      status: "skipped",
      provider: "email",
      errorMessage: "Email address missing",
      metadata,
      createdBy,
    });
  }

  if (!emailSender) {
    return createCommunicationLog({
      academy,
      recipientUser,
      relatedStudent,
      channel: "email",
      type,
      to,
      subject,
      message,
      status: "skipped",
      provider: "email_not_configured",
      errorMessage: "Email service is not configured",
      metadata,
      createdBy,
    });
  }

  try {
    await emailSender({
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    return createCommunicationLog({
      academy,
      recipientUser,
      relatedStudent,
      channel: "email",
      type,
      to,
      subject,
      message,
      status: "sent",
      provider: "email",
      metadata,
      createdBy,
      sentAt: new Date(),
    });
  } catch (error) {
    return createCommunicationLog({
      academy,
      recipientUser,
      relatedStudent,
      channel: "email",
      type,
      to,
      subject,
      message,
      status: "failed",
      provider: "email",
      errorMessage: error.message || "Email sending failed",
      metadata,
      createdBy,
    });
  }
};

export const sendWhatsAppCommunication = async ({
  academy,
  recipientUser = null,
  relatedStudent = null,
  to,
  message,
  type = "system",
  metadata = {},
  createdBy = null,
}) => {
  const allowed = await hasFeature({
    academyId: academy,
    featureName: "whatsapp",
  });

  if (!allowed) {
    return createCommunicationLog({
      academy,
      recipientUser,
      relatedStudent,
      channel: "whatsapp",
      type,
      to,
      subject: "",
      message,
      status: "skipped",
      provider: "plan_restricted",
      providerMessageId: "",
      errorMessage: "WhatsApp requires Premium or Enterprise plan",
      metadata,
      createdBy,
      sentAt: null,
    });
  }

  const result = await sendWhatsAppMessage({
    to,
    message,
    metadata,
  });

  return createCommunicationLog({
    academy,
    recipientUser,
    relatedStudent,
    channel: "whatsapp",
    type,
    to,
    subject: "",
    message,
    status: result.status || "skipped",
    provider: result.provider || "not_configured",
    providerMessageId: result.providerMessageId || "",
    errorMessage: result.errorMessage || "",
    metadata: result.metadata || metadata,
    createdBy,
    sentAt: result.status === "sent" ? new Date() : null,
  });
};

export const createInternalCommunicationLog = async ({
  academy,
  recipientUser = null,
  relatedStudent = null,
  subject = "",
  message = "",
  type = "system",
  metadata = {},
  createdBy = null,
}) => {
  return createCommunicationLog({
    academy,
    recipientUser,
    relatedStudent,
    channel: "internal",
    type,
    to: "",
    subject,
    message,
    status: "sent",
    provider: "internal",
    metadata,
    createdBy,
    sentAt: new Date(),
  });
};