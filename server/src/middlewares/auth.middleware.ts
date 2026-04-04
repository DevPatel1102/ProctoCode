import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../utils/auth.js";

export type AuthenticatedRequest = Request & {
  authUser?: {
    userId: string;
    email: string;
    role: "admin" | "candidate";
  };
};

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return response.status(401).json({
      message: "Unauthorized"
    });
  }

  const token = authorizationHeader.replace("Bearer ", "");

  try {
    request.authUser = verifyAuthToken(token);
    return next();
  } catch {
    return response.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

export function requireAdmin(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  if (request.authUser?.role !== "admin") {
    return response.status(403).json({
      message: "Admin access required"
    });
  }

  return next();
}
