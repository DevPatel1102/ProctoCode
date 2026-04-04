import type { Response } from "express";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { getUserSession } from "../services/session.service.js";

export async function getCurrentTrustScore(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({
        message: "Unauthorized"
      });
    }

    const sessionId = request.query.sessionId;

    if (typeof sessionId !== "string") {
      return response.status(400).json({
        message: "sessionId is required"
      });
    }

    const userSession = await getUserSession(request.authUser.userId, sessionId);

    if (!userSession) {
      return response.status(404).json({
        message: "User session not found"
      });
    }

    return response.status(200).json({
      sessionId: userSession.sessionId.toString(),
      trustScore: userSession.trustScore,
      lastActivity: userSession.lastActivity.toISOString()
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load trust score";

    return response.status(500).json({ message });
  }
}
