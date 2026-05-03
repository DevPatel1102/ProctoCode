import { Schema, Types, model } from "mongoose";

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface SessionDocument {
  sessionName: string;
  sessionCode: string;
  problemTitle?: string;
  problemDescription?: string;
  testCases?: TestCase[];
  durationMinutes?: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    sessionName: {
      type: String,
      required: true,
      trim: true
    },
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    problemTitle: {
      type: String,
      trim: true
    },
    problemDescription: {
      type: String
    },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, default: false }
      }
    ],
    durationMinutes: {
      type: Number,
      min: 1
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Session = model<SessionDocument>("Session", sessionSchema);
