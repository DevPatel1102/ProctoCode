import { Schema, Types, model } from "mongoose";

export interface PasswordResetOtpDocument {
  userId: Types.ObjectId;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetOtpSchema = new Schema<PasswordResetOtpDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetOtp = model<PasswordResetOtpDocument>(
  "PasswordResetOtp",
  passwordResetOtpSchema
);
