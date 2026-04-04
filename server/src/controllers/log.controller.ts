import type { Response } from "express";

import { Log, allowedLogTypes, type LogType } from "../models/log.model.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { applyTrustScorePenalty } from "../services/session.service.js";
import { emitBehaviorLogCreated } from "../sockets/index.js";

export async function createLog(request: AuthenticatedRequest, response: Response) {
  try {
    const { type, timestamp, metadata } = request.body as {
      type?: string;
      timestamp?: number;
      metadata?: Record<string, unknown>;
      sessionId?: string;
    };

    if (!request.authUser?.userId) {
      return response.status(401).json({
        message: "Unauthorized"
      });
    }

    if (!type || !allowedLogTypes.includes(type as LogType)) {
      return response.status(400).json({
        message: "Invalid event type"
      });
    }

    if (!timestamp || Number.isNaN(timestamp)) {
      return response.status(400).json({
        message: "Invalid timestamp"
      });
    }

    if (!request.body.sessionId || typeof request.body.sessionId !== "string") {
      return response.status(400).json({
        message: "sessionId is required"
      });
    }

    const userSession = await applyTrustScorePenalty(
      request.authUser.userId,
      request.body.sessionId,
      type as LogType
    );

    const log = await Log.create({
      userId: request.authUser.userId,
      sessionId: request.body.sessionId,
      type,
      timestamp: new Date(timestamp),
      metadata: metadata ?? {},
      trustScoreAfter: userSession.trustScore
    });

    emitBehaviorLogCreated({
      id: log._id.toString(),
      userId: request.authUser.userId,
      email: request.authUser.email,
      type: log.type,
      timestamp: log.timestamp.toISOString(),
      metadata: (log.metadata as Record<string, unknown> | undefined) ?? {},
      trustScore: userSession.trustScore,
      sessionId: request.body.sessionId
    });

    return response.status(201).json({
      success: true,
      trustScore: userSession.trustScore,
      sessionId: request.body.sessionId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to store log";

    return response.status(500).json({
      message
    });
  }
}
