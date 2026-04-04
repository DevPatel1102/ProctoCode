import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: "admin" | "candidate";
};

export function generateAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
