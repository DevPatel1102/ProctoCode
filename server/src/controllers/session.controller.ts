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
  listSessionUsers,
  submitCandidateCode
} from "../services/session.service.js";

export async function createNewSession(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionName, problemTitle, problemDescription, durationMinutes, testCases } =
      request.body as {
        sessionName?: string;
        problemTitle?: string;
        problemDescription?: string;
        durationMinutes?: number;
        testCases?: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
      };

    if (!sessionName?.trim()) {
      return response.status(400).json({ message: "sessionName is required" });
    }

    const session = await createSession(request.authUser.userId, sessionName, {
      problemTitle,
      problemDescription,
      durationMinutes,
      testCases
    });

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
      trustScore: result.userSession.trustScore,
      problemTitle: result.session.problemTitle,
      problemDescription: result.session.problemDescription,
      durationMinutes: result.session.durationMinutes,
      testCases: result.session.testCases?.filter((tc) => !tc.isHidden).map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      })),
      startedAt: result.userSession.startedAt?.toISOString?.() || result.userSession.lastActivity?.toISOString?.() || new Date().toISOString()
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
        lastActivity: userSession.lastActivity?.toISOString?.() || new Date().toISOString(),
        startedAt: userSession.startedAt?.toISOString?.() || userSession.lastActivity?.toISOString?.() || new Date().toISOString(),
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
              problemTitle:
                "problemTitle" in userSession.sessionId
                  ? String(userSession.sessionId.problemTitle || "")
                  : "",
              problemDescription:
                "problemDescription" in userSession.sessionId
                  ? String(userSession.sessionId.problemDescription || "")
                  : "",
              durationMinutes:
                "durationMinutes" in userSession.sessionId
                  ? Number(userSession.sessionId.durationMinutes || 0)
                  : 0,
              testCases:
                "testCases" in userSession.sessionId && Array.isArray(userSession.sessionId.testCases)
                  ? userSession.sessionId.testCases.filter((tc: any) => !tc.isHidden).map((tc: any) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                  }))
                  : [],
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

export async function candidateCodeSubmit(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId, code } = request.body as {
      sessionId?: string;
      code?: string;
    };

    if (!sessionId || !code) {
      return response.status(400).json({ message: "sessionId and code are required" });
    }

    await submitCandidateCode(request.authUser.userId, sessionId, code);

    return response.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit code";
    return response.status(400).json({ message });
  }
}

export async function getSessionReport(
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

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"` ;

    const headers = ["Candidate Email", "Trust Score", "Joined At", "Left At", "Submitted At", "Submitted Code"];
    const rows = sessionUsers.map((us) => {
      const email =
        typeof us.userId === "object" && us.userId && "email" in us.userId
          ? String(us.userId.email)
          : "Unknown";
      const joinedAt = us.createdAt?.toISOString?.() || "";
      const leftAt = us.leftAt ? us.leftAt.toISOString() : "Active";
      const submittedAt = us.submittedAt ? us.submittedAt.toISOString() : "Not Submitted";
      const submittedCode = us.submittedCode || "";

      return [
        escapeCsv(email),
        String(us.trustScore),
        escapeCsv(joinedAt),
        escapeCsv(leftAt),
        escapeCsv(submittedAt),
        escapeCsv(submittedCode)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    response.setHeader("Content-Type", "text/csv");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="session_report_${sessionId}.csv"`
    );
    return response.status(200).send(csvContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return response.status(500).json({ message });
  }
}
