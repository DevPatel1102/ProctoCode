import type { Response } from "express";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  createSession,
  deactivateSession,
  deleteSessionHistory,
  joinSession,
  leaveSession,
  listSessions,
  listUserSessions,
  listSessionUsers
} from "../services/session.service.js";

export async function createNewSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionName } = request.body as {
      sessionName?: string;
    };

    if (!sessionName?.trim()) {
      return response.status(400).json({ message: "sessionName is required" });
    }

    const session = await createSession(request.authUser.userId, sessionName);

    return response.status(201).json({
      sessionId: session.id,
      sessionCode: session.sessionCode,
      sessionName: session.sessionName
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session";
    return response.status(500).json({ message });
  }
}

export async function joinExistingSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (request.authUser.role === "admin") {
      return response.status(403).json({
        message: "Admins cannot join candidate sessions"
      });
    }

    const { sessionCode } = request.body as {
      sessionCode?: string;
    };

    if (!sessionCode) {
      return response.status(400).json({ message: "sessionCode is required" });
    }

    const result = await joinSession(request.authUser.userId, sessionCode);

    return response.status(200).json({
      success: true,
      sessionId: result.session.id,
      sessionCode: result.session.sessionCode,
      trustScore: result.userSession.trustScore
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join session";
    return response.status(400).json({ message });
  }
}

export async function getSessions(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await listSessions(request.authUser.userId);

    return response.status(200).json({
      sessions: sessions.map((session) => ({
        id: session._id.toString(),
        sessionName: session.sessionName,
        sessionCode: session.sessionCode,
        isActive: session.isActive,
        createdAt: session.createdAt.toISOString()
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sessions";
    return response.status(500).json({ message });
  }
}

export async function getMySessions(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await listUserSessions(request.authUser.userId);

    return response.status(200).json({
      sessions: sessions.map((userSession) => ({
        id: userSession._id.toString(),
        trustScore: userSession.trustScore,
        lastActivity: userSession.lastActivity.toISOString(),
        leftAt: userSession.leftAt ? userSession.leftAt.toISOString() : null,
        session:
          typeof userSession.sessionId === "object" &&
          userSession.sessionId &&
          "_id" in userSession.sessionId
            ? {
                id: userSession.sessionId._id.toString(),
                sessionName:
                  "sessionName" in userSession.sessionId
                    ? String(userSession.sessionId.sessionName)
                    : "Unnamed Session",
                sessionCode:
                  "sessionCode" in userSession.sessionId
                    ? String(userSession.sessionId.sessionCode)
                    : "",
                isActive:
                  "isActive" in userSession.sessionId
                    ? Boolean(userSession.sessionId.isActive)
                    : false,
                createdAt:
                  "createdAt" in userSession.sessionId
                    ? new Date(
                        userSession.sessionId.createdAt as string | number | Date
                      ).toISOString()
                    : null
              }
            : null
      }))
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user sessions";
    return response.status(500).json({ message });
  }
}

export async function deactivateExistingSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessionId = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    const session = await deactivateSession(sessionId, request.authUser.userId);

    return response.status(200).json({
      success: true,
      sessionId: session.id,
      isActive: session.isActive
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to deactivate session";
    return response.status(400).json({ message });
  }
}

export async function getSessionUsers(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessionId = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    const sessionUsers = await listSessionUsers(sessionId, request.authUser.userId);

    return response.status(200).json({
      users: sessionUsers.map((userSession) => ({
        id: userSession._id.toString(),
        userId:
          typeof userSession.userId === "object" &&
          userSession.userId &&
          "_id" in userSession.userId
            ? userSession.userId._id.toString()
            : String(userSession.userId),
        email:
          typeof userSession.userId === "object" &&
          userSession.userId &&
          "email" in userSession.userId
            ? String(userSession.userId.email)
            : "Unknown user",
        trustScore: userSession.trustScore,
        lastActivity: userSession.lastActivity.toISOString(),
        leftAt: userSession.leftAt ? userSession.leftAt.toISOString() : null
      }))
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load session users";
    return response.status(500).json({ message });
  }
}

export async function leaveCurrentSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = request.body as {
      sessionId?: string;
    };

    if (!sessionId) {
      return response.status(400).json({ message: "sessionId is required" });
    }

    await leaveSession(request.authUser.userId, sessionId);

    return response.status(200).json({
      success: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to leave session";
    return response.status(400).json({ message });
  }
}

export async function deleteExistingSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const sessionId = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    const session = await deleteSessionHistory(sessionId, request.authUser.userId);

    return response.status(200).json({
      success: true,
      sessionId: session.id
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete session history";
    return response.status(400).json({ message });
  }
}
