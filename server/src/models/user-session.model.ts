import { Schema, Types, model } from "mongoose";

export interface UserSessionDocument {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  trustScore: number;
  lastActivity: Date;
  startedAt: Date;
  leftAt?: Date | null;
  submittedCode?: string | null;
  submittedAt?: Date | null;
  aiCodeReview?: {
    qualityScore: number;
    timeComplexity: string;
    spaceComplexity: string;
    approach: string;
    readability: string;
    issues: string[];
    strengths: string[];
    suggestions: string[];
    summary: string;
    reviewedAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<UserSessionDocument>(
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
    trustScore: {
      type: Number,
      default: 100,
      required: true
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    leftAt: {
      type: Date,
      default: null
    },
    submittedCode: {
      type: String,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    aiCodeReview: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const UserSession = model<UserSessionDocument>("UserSession", userSessionSchema);
