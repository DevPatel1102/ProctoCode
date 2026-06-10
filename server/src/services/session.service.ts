import crypto from "node:crypto";

import { Log } from "../models/log.model.js";
import { Session } from "../models/session.model.js";
import { UserSession } from "../models/user-session.model.js";
import type { LogType } from "../models/log.model.js";
import { reviewCode } from "./ai.service.js";

const TRUST_SCORE_RULES: Partial<Record<LogType, number>> = {
  TAB_HIDDEN: 10,
  PASTE: 20,
  INACTIVE: 5
};

function generateSessionCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

async function getOwnedSession(sessionId: string, createdBy: string) {
  const session = await Session.findOne({
    _id: sessionId,
    createdBy
  });

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

export async function createSession(
  createdBy: string,
  sessionName: string,
  options?: {
    problemTitle?: string;
    problemDescription?: string;
    testCases?: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
    durationMinutes?: number;
  }
) {
  let attempts = 0;

  while (attempts < 10) {
    const sessionCode = generateSessionCode();
    const existing = await Session.findOne({ sessionCode });

    if (!existing) {
      return Session.create({
        sessionName: sessionName.trim(),
        sessionCode,
        problemTitle: options?.problemTitle?.trim(),
        problemDescription: options?.problemDescription,
        testCases: options?.testCases,
        durationMinutes: options?.durationMinutes,
        createdBy,
        isActive: true
      });
    }

    attempts += 1;
  }

  throw new Error("Failed to generate a unique session code");
}

export async function joinSession(userId: string, sessionCode: string) {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const session = await Session.findOne({
    sessionCode: normalizedCode,
    isActive: true
  });

  if (!session) {
    throw new Error("Session not found or inactive");
  }

  const existingUserSession = await UserSession.findOne({
    userId,
    sessionId: session.id
  });

  if (existingUserSession) {
    existingUserSession.lastActivity = new Date();
    existingUserSession.leftAt = null;
    await existingUserSession.save();

    return {
      session,
      userSession: existingUserSession
    };
  }

  const userSession = await UserSession.create({
    userId,
    sessionId: session.id,
    trustScore: 100,
    lastActivity: new Date()
  });

  return {
    session,
    userSession
  };
}

export async function getUserSession(userId: string, sessionId: string) {
  return UserSession.findOne({
    userId,
    sessionId
  });
}

export async function applyTrustScorePenalty(
  userId: string,
  sessionId: string,
  eventType: LogType
) {
  const session = await Session.findById(sessionId);

  if (!session || !session.isActive) {
    throw new Error("Session is inactive");
  }

  const userSession = await getUserSession(userId, sessionId);

  if (!userSession || userSession.leftAt) {
    throw new Error("User is not part of this session");
  }

  const penalty = TRUST_SCORE_RULES[eventType] ?? 0;
  userSession.trustScore = Math.max(0, userSession.trustScore - penalty);
  userSession.lastActivity = new Date();
  await userSession.save();

  return userSession;
}

export async function listSessions(createdBy: string) {
  return Session.find({ createdBy }).sort({ createdAt: -1 }).lean();
}

export async function listSessionUsers(sessionId: string, createdBy: string) {
  await getOwnedSession(sessionId, createdBy);

  return UserSession.find({ sessionId })
    .populate("userId", "email")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function listUserSessions(userId: string) {
  return UserSession.find({ userId })
    .populate("sessionId", "sessionName sessionCode isActive createdAt problemTitle problemDescription durationMinutes testCases")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function deactivateSession(sessionId: string, createdBy: string) {
  const session = await getOwnedSession(sessionId, createdBy);

  session.isActive = false;
  await session.save();

  return session;
}

export async function leaveSession(userId: string, sessionId: string) {
  const userSession = await UserSession.findOne({
    userId,
    sessionId
  });

  if (!userSession) {
    throw new Error("User session not found");
  }

  userSession.leftAt = new Date();
  userSession.lastActivity = new Date();
  await userSession.save();

  return userSession;
}

export async function deleteSessionHistory(sessionId: string, createdBy: string) {
  const session = await getOwnedSession(sessionId, createdBy);

  await Promise.all([
    Log.deleteMany({ sessionId }),
    UserSession.deleteMany({ sessionId }),
    Session.deleteOne({ _id: sessionId })
  ]);

  return session;
}

export async function submitCandidateCode(userId: string, sessionId: string, code: string) {
  const userSession = await UserSession.findOne({ userId, sessionId });

  if (!userSession) {
    throw new Error("User session not found");
  }

  if (userSession.submittedAt) {
    throw new Error("You have already submitted your code. Multiple submissions are not allowed.");
  }

  userSession.submittedCode = code;
  userSession.submittedAt = new Date();
  userSession.lastActivity = new Date();
  await userSession.save();

  // Fire-and-forget AI code review
  Session.findById(sessionId)
    .then((session) => {
      if (!session) return;

      return reviewCode({
        code,
        language: "javascript",
        problemTitle: session.problemTitle || "Untitled Problem",
        problemDescription: session.problemDescription || ""
      });
    })
    .then((review) => {
      if (review) {
        return UserSession.updateOne(
          { _id: userSession._id },
          { $set: { aiCodeReview: review } }
        );
      }
    })
    .catch((error) => {
      console.error("[session.service] Background AI review failed:", error);
    });

  return userSession;
}
