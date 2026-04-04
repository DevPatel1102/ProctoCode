import type { Response } from "express";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { Log } from "../models/log.model.js";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";

export async function getMonitorUsers(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const ownedSessionIds = await Session.find(
      { createdBy: request.authUser.userId },
      { _id: 1 }
    ).lean();
    const sessionIds = ownedSessionIds.map((session) => session._id);

    if (!sessionIds.length) {
      return response.status(200).json({ users: [] });
    }

    const userIds = await Log.distinct("userId", {
      sessionId: { $in: sessionIds }
    });

    const users = await User.find(
      { _id: { $in: userIds } },
      { email: 1 }
    )
      .sort({ createdAt: 1 })
      .lean();

    return response.status(200).json({
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";

    return response.status(500).json({ message });
  }
}

export async function getRecentLogs(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessionId = request.query.sessionId;
    const userId = request.query.userId;
    const query: Record<string, unknown> = {};

    const ownedSessionIds = await Session.find(
      { createdBy: request.authUser.userId },
      { _id: 1 }
    ).lean();
    const allowedSessionIds = ownedSessionIds.map((session) => session._id.toString());

    if (!allowedSessionIds.length) {
      return response.status(200).json({ events: [] });
    }

    if (typeof sessionId === "string") {
      if (!allowedSessionIds.includes(sessionId)) {
        return response.status(403).json({ message: "Session access denied" });
      }

      query.sessionId = sessionId;
    } else {
      query.sessionId = { $in: allowedSessionIds };
    }

    if (typeof userId === "string") {
      query.userId = userId;
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .populate("userId", "email")
      .lean();

    return response.status(200).json({
      events: logs.map((log) => ({
        id: log._id.toString(),
        userId:
          typeof log.userId === "object" && log.userId && "_id" in log.userId
            ? log.userId._id.toString()
            : String(log.userId),
        email:
          typeof log.userId === "object" && log.userId && "email" in log.userId
            ? String(log.userId.email)
            : "Unknown user",
        type: log.type,
        timestamp: log.timestamp.toISOString(),
        metadata: (log.metadata as Record<string, unknown> | undefined) ?? {},
        trustScore: log.trustScoreAfter ?? 100,
        sessionId:
          typeof log.sessionId === "object" && log.sessionId && "_id" in log.sessionId
            ? log.sessionId._id.toString()
            : String(log.sessionId)
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load logs";

    return response.status(500).json({ message });
  }
}
