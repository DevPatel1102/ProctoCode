import { Schema, Types, model } from "mongoose";

export interface SessionDocument {
  sessionName: string;
  sessionCode: string;
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
