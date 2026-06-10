import type { Response } from "express";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { Log } from "../models/log.model.js";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";
import { UserSession } from "../models/user-session.model.js";
import { analyzeBehavior, generateProblem, generateSessionSummary, isAiAvailable, reviewCode } from "../services/ai.service.js";

export async function getCodeReview(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId, userId } = request.query as {
      sessionId?: string;
      userId?: string;
    };

    if (!sessionId || !userId) {
      return response.status(400).json({ message: "sessionId and userId are required" });
    }

    const userSession = await UserSession.findOne({ userId, sessionId }).lean();

    if (!userSession) {
      return response.status(404).json({ message: "User session not found" });
    }

    return response.status(200).json({
      review: (userSession as any).aiCodeReview ?? null,
      hasSubmittedCode: Boolean(userSession.submittedCode)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get code review";
    return response.status(500).json({ message });
  }
}

export async function triggerCodeReview(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId, userId } = request.body as {
      sessionId?: string;
      userId?: string;
    };

    if (!sessionId || !userId) {
      return response.status(400).json({ message: "sessionId and userId are required" });
    }

    if (!isAiAvailable()) {
      return response.status(503).json({ message: "AI review is not configured" });
    }

    const userSession = await UserSession.findOne({ userId, sessionId });

    if (!userSession) {
      return response.status(404).json({ message: "User session not found" });
    }

    if (!userSession.submittedCode) {
      return response.status(400).json({ message: "No code has been submitted yet" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return response.status(404).json({ message: "Session not found" });
    }

    const review = await reviewCode({
      code: userSession.submittedCode,
      language: "javascript",
      problemTitle: session.problemTitle || "Untitled Problem",
      problemDescription: session.problemDescription || ""
    });

    if (review) {
      userSession.set("aiCodeReview", review);
      await userSession.save();
    }

    return response.status(200).json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger code review";
    return response.status(500).json({ message });
  }
}

export async function generateProblemHandler(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (!isAiAvailable()) {
      return response.status(503).json({ message: "AI is not configured. Please add GROQ_API_KEY to your environment." });
    }

    const { difficulty, topic, language } = request.body as {
      difficulty?: string;
      topic?: string;
      language?: string;
    };

    const validDifficulties = ["Easy", "Medium", "Hard"];
    const safeDifficulty = validDifficulties.includes(difficulty ?? "")
      ? (difficulty as "Easy" | "Medium" | "Hard")
      : "Medium";

    const safeTopic = String(topic || "Arrays").trim().slice(0, 100);
    const safeLanguage = String(language || "javascript").trim();

    const problem = await generateProblem({
      difficulty: safeDifficulty,
      topic: safeTopic,
      language: safeLanguage
    });

    if (!problem) {
      return response.status(500).json({ message: "Failed to generate problem. Please try again." });
    }

    return response.status(200).json({ problem });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate problem";
    return response.status(500).json({ message });
  }
}

export async function analyzeBehaviorHandler(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (!isAiAvailable()) {
      return response.status(503).json({ message: "AI is not configured. Please add GROQ_API_KEY to your environment." });
    }

    const { sessionId, userId } = request.body as {
      sessionId?: string;
      userId?: string;
    };

    if (!sessionId || !userId) {
      return response.status(400).json({ message: "sessionId and userId are required" });
    }

    // Fetch all behavior logs for this candidate in this session (chronological)
    const logs = await Log.find({ sessionId, userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Fetch session for duration info and candidate email
    const session = await Session.findById(sessionId).lean();
    const userSession = await UserSession.findOne({ sessionId, userId }).lean();

    const sessionDurationMinutes = session?.durationMinutes ?? 60;

    // Get candidate email from the Log populate or UserSession
    const candidateEmail = userSession
      ? `user:${String(userId).slice(-6)}`
      : "Unknown candidate";

    const events = logs.map((log) => ({
      type: log.type,
      timestamp: log.timestamp.toISOString(),
      trustScore: log.trustScoreAfter ?? 100,
      metadata: (log.metadata as Record<string, unknown> | undefined) ?? {}
    }));

    const analysis = await analyzeBehavior({
      events,
      sessionDurationMinutes,
      candidateEmail
    });

    if (!analysis) {
      return response.status(500).json({ message: "Failed to analyze behavior. Please try again." });
    }

    return response.status(200).json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze behavior";
    return response.status(500).json({ message });
  }
}

export async function sessionSummaryHandler(
  request: AuthenticatedRequest,
  response: Response
) {
  try {
    if (!request.authUser?.userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (!isAiAvailable()) {
      return response.status(503).json({ message: "AI is not configured. Please add GROQ_API_KEY to your environment." });
    }

    const { sessionId } = request.body as { sessionId?: string };
    if (!sessionId) {
      return response.status(400).json({ message: "sessionId is required" });
    }

    // Verify admin owns this session
    const session = await Session.findOne({
      _id: sessionId,
      createdBy: request.authUser.userId
    }).lean();

    if (!session) {
      return response.status(404).json({ message: "Session not found" });
    }

    // Fetch all user sessions for this session
    const userSessions = await UserSession.find({ sessionId }).lean();

    if (userSessions.length === 0) {
      return response.status(400).json({ message: "No candidates have joined this session yet." });
    }

    // Fetch all users + logs for this session in parallel
    const userIds = userSessions.map((us) => us.userId);

    const [users, allLogs] = await Promise.all([
      User.find({ _id: { $in: userIds } }, { email: 1 }).lean(),
      Log.find({ sessionId }).lean()
    ]);

    const userEmailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    // Build per-candidate data
    const candidates = userSessions.map((us) => {
      const uid = us.userId.toString();
      const userLogs = allLogs.filter((l) => l.userId.toString() === uid);
      const tabSwitches = userLogs.filter((l) => l.type === "TAB_HIDDEN").length;
      const pastes = userLogs.filter((l) => l.type === "PASTE").length;

      const review = us.aiCodeReview as {
        qualityScore?: number;
        timeComplexity?: string;
        summary?: string;
      } | null | undefined;

      return {
        email: userEmailMap.get(uid) ?? `user:${uid.slice(-6)}`,
        trustScore: us.trustScore,
        hasSubmitted: Boolean(us.submittedCode),
        submittedAt: us.submittedAt ? new Date(us.submittedAt).toLocaleTimeString() : undefined,
        leftSession: Boolean(us.leftAt),
        eventCount: userLogs.length,
        tabSwitches,
        pastes,
        codeQualityScore: review?.qualityScore,
        timeComplexity: review?.timeComplexity,
        codeSummary: review?.summary
      };
    });

    const summary = await generateSessionSummary({
      sessionName: session.sessionName,
      problemTitle: session.problemTitle ?? "Untitled Problem",
      durationMinutes: session.durationMinutes ?? 60,
      candidates
    });

    if (!summary) {
      return response.status(500).json({ message: "Failed to generate session summary. Please try again." });
    }

    return response.status(200).json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate session summary";
    return response.status(500).json({ message });
  }
}
