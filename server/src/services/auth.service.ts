import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { PasswordResetOtp } from "../models/password-reset-otp.model.js";
import { User } from "../models/user.model.js";
import { sendPasswordResetOtpEmail } from "./email.service.js";
import { generateAuthToken } from "../utils/auth.js";

type AuthInput = {
  email: string;
  password: string;
};

type SignupInput = AuthInput & {
  role: "admin" | "candidate" | "student";
};

type ResetPasswordInput = {
  email: string;
  otp: string;
  newPassword: string;
};

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRole(role: SignupInput["role"]) {
  return role === "student" ? "candidate" : role;
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function signupUser({ email, password, role }: SignupInput) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    role: normalizeRole(role)
  });

  const token = generateAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}

export async function loginUser({ email, password }: AuthInput) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message:
        "If an account exists for that email, an OTP has been generated for password reset."
    };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetOtp.deleteMany({ userId: user._id });
  const resetRecord = await PasswordResetOtp.create({
    userId: user._id,
    codeHash: otpHash,
    expiresAt
  });

  try {
    await sendPasswordResetOtpEmail(user.email, otp);
  } catch (error) {
    await PasswordResetOtp.deleteOne({ _id: resetRecord._id });
    throw new Error(
      error instanceof Error
        ? `Failed to send reset OTP email: ${error.message}`
        : "Failed to send reset OTP email"
    );
  }

  return {
    message:
      "If an account exists for that email, an OTP has been sent for password reset."
  };
}

export async function resetPasswordWithOtp({
  email,
  otp,
  newPassword
}: ResetPasswordInput) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid or expired OTP");
  }

  const resetRecord = await PasswordResetOtp.findOne({
    userId: user._id,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!resetRecord) {
    throw new Error("Invalid or expired OTP");
  }

  const isOtpValid = await bcrypt.compare(otp, resetRecord.codeHash);

  if (!isOtpValid) {
    resetRecord.attempts += 1;

    if (resetRecord.attempts >= MAX_OTP_ATTEMPTS) {
      resetRecord.consumedAt = new Date();
    }

    await resetRecord.save();
    throw new Error("Invalid or expired OTP");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  resetRecord.consumedAt = new Date();
  await resetRecord.save();
  await PasswordResetOtp.deleteMany({
    userId: user._id,
    _id: { $ne: resetRecord._id }
  });

  return {
    message: "Password reset successful"
  };
}
