import nodemailer from "nodemailer";

import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and SMTP_FROM in server/.env."
    );
  }

  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  return transporter;
}

export async function sendPasswordResetOtpEmail(email: string, otp: string) {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Ghost-Proof password reset OTP",
    text: `Your Ghost-Proof OTP is ${otp}. It expires in 10 minutes. If you did not request this reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #020617; color: #e2e8f0; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px;">
          <p style="font-size: 12px; letter-spacing: 0.35em; text-transform: uppercase; color: #67e8f9; margin: 0 0 16px;">
            Ghost-Proof
          </p>
          <h1 style="font-size: 28px; margin: 0 0 16px; color: #ffffff;">
            Password reset OTP
          </h1>
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 24px; color: #cbd5e1;">
            Use the one-time password below to reset your Ghost-Proof account password.
            This code expires in 10 minutes.
          </p>
          <div style="background: rgba(34,211,238,0.12); border: 1px solid rgba(103,232,249,0.35); border-radius: 18px; padding: 18px 20px; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; text-align: center; color: #ffffff;">
            ${otp}
          </div>
          <p style="font-size: 14px; line-height: 1.7; margin: 24px 0 0; color: #94a3b8;">
            If you did not request this reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `
  });
}
