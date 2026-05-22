import nodemailer from "nodemailer";
import env from "../config/env.js";
import logger from "../utils/logger.js";

const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn(
      `Email service not configured. Development email skipped for: ${to}`
    );
    logger.info(`Email subject: ${subject}`);
    logger.info(`Email text: ${text}`);
    return;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = "Reset your KHILADI Academy Manager password";

  const text = `You requested a password reset. This link will expire in 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Reset your password</h2>
      <p>You requested a password reset for KHILADI Academy Manager.</p>
      <p>This link will expire in <strong>15 minutes</strong>.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};