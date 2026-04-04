import { Schema, Types, model } from "mongoose";

export const allowedLogTypes = [
  "TAB_HIDDEN",
  "TAB_VISIBLE",
  "PASTE",
  "INACTIVE",
  "FAST_TYPING"
] as const;

export type LogType = (typeof allowedLogTypes)[number];

export interface LogDocument {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  type: LogType;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  trustScoreAfter?: number;
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<LogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },
    type: {
      type: String,
      enum: allowedLogTypes,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    trustScoreAfter: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

export const Log = model<LogDocument>("Log", logSchema);
