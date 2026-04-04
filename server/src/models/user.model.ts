import { Schema, model } from "mongoose";

export interface UserDocument {
  email: string;
  password: string;
  role: "admin" | "candidate";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "candidate"],
      default: "candidate",
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const User = model<UserDocument>("User", userSchema);
