import { Groq } from "groq-sdk";

import { env } from "../config/env.js";

export interface CodeReviewResult {
  qualityScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  readability: "Excellent" | "Good" | "Fair" | "Poor";
  issues: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
  reviewedAt: Date;
}

export interface GeneratedProblem {
  title: string;
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

export interface BehaviorAnalysisResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidencePercent: number;
  summary: string;
  suspiciousPatterns: string[];
  innocentPatterns: string[];
  keyEvents: Array<{
    timestamp: string;
    event: string;
    significance: string;
  }>;
  recommendation: string;
  analyzedAt: Date;
}

export function isAiAvailable(): boolean {
  return Boolean(env.groqApiKey);
}

export async function reviewCode({
  code,
  language,
  problemTitle,
  problemDescription
}: {
  code: string;
  language: string;
  problemTitle: string;
  problemDescription: string;
}): Promise<CodeReviewResult | null> {
  if (!env.groqApiKey) {
    return null;
  }

  const groq = new Groq({ apiKey: env.groqApiKey });

  const prompt = `You are an expert code reviewer. Analyze the following code submission for a coding problem and return a JSON object with your review.

Problem Title: ${problemTitle}
Problem Description: ${problemDescription}
Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY a valid JSON object (no markdown, no code fences) with the following fields:
- "qualityScore": a number from 0 to 100 representing overall code quality
- "timeComplexity": a string like "O(n log n)" describing the time complexity
- "spaceComplexity": a string like "O(n)" describing the space complexity
- "approach": a string describing the approach/algorithm used
- "readability": one of "Excellent", "Good", "Fair", or "Poor"
- "issues": an array of strings listing bugs or problems found
- "strengths": an array of strings listing good aspects of the code
- "suggestions": an array of strings listing improvement suggestions
- "summary": a 2-3 sentence overall summary of the code quality`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";

    const parsed = JSON.parse(responseText);

    return {
      qualityScore: Math.min(100, Math.max(0, Number(parsed.qualityScore) || 0)),
      timeComplexity: String(parsed.timeComplexity || "Unknown"),
      spaceComplexity: String(parsed.spaceComplexity || "Unknown"),
      approach: String(parsed.approach || "Unknown"),
      readability: ["Excellent", "Good", "Fair", "Poor"].includes(parsed.readability)
        ? parsed.readability
        : "Fair",
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
      summary: String(parsed.summary || "Review could not be completed."),
      reviewedAt: new Date()
    };
  } catch (error) {
    console.error("[ai.service] Failed to review code:", error);

    return {
      qualityScore: 0,
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      approach: "Unable to determine",
      readability: "Fair",
      issues: ["AI review failed — the response could not be processed."],
      strengths: [],
      suggestions: ["Please trigger a manual review."],
      summary: "The AI code review could not be completed due to an error.",
      reviewedAt: new Date()
    };
  }
}

export async function generateProblem({
  difficulty,
  topic,
  language
}: {
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  language: string;
}): Promise<GeneratedProblem | null> {
  if (!env.groqApiKey) {
    return null;
  }

  const groq = new Groq({ apiKey: env.groqApiKey });

  const prompt = `You are an expert coding interview problem designer. Create a ${difficulty} difficulty coding problem about the topic: "${topic}" for a ${language} coding interview.

Return ONLY a valid JSON object (no markdown, no code fences) with these exact fields:
- "title": a concise problem title (string)
- "description": a detailed problem description explaining what needs to be solved, written clearly for a candidate (string, 3-5 sentences)
- "constraints": an array of constraint strings like ["1 <= n <= 10^5", "Array elements are integers", "-10^9 <= arr[i] <= 10^9"]
- "examples": an array of 2 example objects, each with "input" (string), "output" (string), and "explanation" (string)
- "testCases": an array of exactly 5 test case objects, each with "input" (string — the exact stdin input), "expectedOutput" (string — the exact stdout output), and "isHidden" (boolean — first 3 are false, last 2 are true)
- "difficulty": one of "Easy", "Medium", or "Hard" (should match the requested difficulty)
- "topic": the topic/category of the problem (string)

IMPORTANT: The test case inputs and outputs must be precise and unambiguous. Each input should be the raw stdin the program reads, and each expectedOutput should be the exact stdout the program should print.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(responseText);

    const validDifficulties = ["Easy", "Medium", "Hard"];

    return {
      title: String(parsed.title || "Untitled Problem"),
      description: String(parsed.description || ""),
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [],
      examples: Array.isArray(parsed.examples)
        ? parsed.examples.map((ex: { input: unknown; output: unknown; explanation?: unknown }) => ({
            input: String(ex.input || ""),
            output: String(ex.output || ""),
            explanation: ex.explanation ? String(ex.explanation) : undefined
          }))
        : [],
      testCases: Array.isArray(parsed.testCases)
        ? parsed.testCases.map((tc: { input: unknown; expectedOutput: unknown; isHidden: unknown }) => ({
            input: String(tc.input || ""),
            expectedOutput: String(tc.expectedOutput || ""),
            isHidden: Boolean(tc.isHidden)
          }))
        : [],
      difficulty: validDifficulties.includes(parsed.difficulty) ? parsed.difficulty : difficulty,
      topic: String(parsed.topic || topic)
    };
  } catch (error) {
    console.error("[ai.service] Failed to generate problem:", error);
    return null;
  }
}

export async function analyzeBehavior({
  events,
  sessionDurationMinutes,
  candidateEmail
}: {
  events: Array<{
    type: string;
    timestamp: string;
    trustScore: number;
    metadata?: Record<string, unknown>;
  }>;
  sessionDurationMinutes: number;
  candidateEmail: string;
}): Promise<BehaviorAnalysisResult | null> {
  if (!env.groqApiKey) {
    return null;
  }

  if (events.length === 0) {
    return {
      riskLevel: "LOW",
      confidencePercent: 95,
      summary: "No suspicious behavior events recorded during this session.",
      suspiciousPatterns: [],
      innocentPatterns: ["No events triggered"],
      keyEvents: [],
      recommendation: "No action required. The candidate completed the session cleanly.",
      analyzedAt: new Date()
    };
  }

  const groq = new Groq({ apiKey: env.groqApiKey });

  // Build a readable event timeline for the prompt
  const eventLines = events
    .slice(0, 80) // cap to avoid token limits
    .map((e, i) => {
      const meta = e.metadata && Object.keys(e.metadata).length
        ? ` | metadata: ${JSON.stringify(e.metadata)}`
        : "";
      return `${i + 1}. [${new Date(e.timestamp).toLocaleTimeString()}] ${e.type} | trust_score: ${e.trustScore}${meta}`;
    })
    .join("\n");

  const tabSwitches = events.filter(e => e.type === "TAB_HIDDEN").length;
  const pastes = events.filter(e => e.type === "PASTE").length;
  const inactiveEvents = events.filter(e => e.type === "INACTIVE").length;
  const fastTyping = events.filter(e => e.type === "FAST_TYPING").length;
  const finalTrustScore = events[0]?.trustScore ?? 100;

  const prompt = `You are an expert online exam proctoring analyst. Analyze the following behavior log from a coding interview session and determine if the candidate shows signs of cheating or external assistance.

Candidate: ${candidateEmail}
Session Duration: ${sessionDurationMinutes} minutes
Final Trust Score: ${finalTrustScore}/100
Event Summary: ${tabSwitches} tab switches, ${pastes} paste events, ${inactiveEvents} inactivity events, ${fastTyping} fast typing events
Total Events: ${events.length}

CHRONOLOGICAL EVENT LOG (newest first):
${eventLines}

Analyze the PATTERNS, not just the counts. Look for:
- Tab switches immediately followed by paste events (suggests copying from another tab)
- Multiple rapid tab switches in short time windows
- Large paste events (metadata.length > 100) after tab switches
- Inactivity followed by sudden bursts of fast typing or pastes
- Trust score drops that cluster together (suggests concentrated cheating)
- Fast typing that is unusually fast for the problem complexity

Return ONLY a valid JSON object with these fields:
- "riskLevel": one of "LOW", "MEDIUM", "HIGH", or "CRITICAL"
- "confidencePercent": a number 0-100 representing your confidence in this assessment
- "summary": a 2-3 sentence plain English summary of your findings
- "suspiciousPatterns": an array of strings describing suspicious patterns found (empty array if none)
- "innocentPatterns": an array of strings describing behavior that appears innocent or explainable
- "keyEvents": an array of up to 5 objects with fields: "timestamp" (time string), "event" (event type), "significance" (1 sentence explaining why this event is noteworthy)
- "recommendation": a 1-2 sentence recommendation for the evaluator on what action to take`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(responseText);

    const validRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    return {
      riskLevel: validRiskLevels.includes(parsed.riskLevel) ? parsed.riskLevel : "MEDIUM",
      confidencePercent: Math.min(100, Math.max(0, Number(parsed.confidencePercent) || 50)),
      summary: String(parsed.summary || "Analysis could not be completed."),
      suspiciousPatterns: Array.isArray(parsed.suspiciousPatterns)
        ? parsed.suspiciousPatterns.map(String)
        : [],
      innocentPatterns: Array.isArray(parsed.innocentPatterns)
        ? parsed.innocentPatterns.map(String)
        : [],
      keyEvents: Array.isArray(parsed.keyEvents)
        ? parsed.keyEvents.slice(0, 5).map((e: { timestamp?: unknown; event?: unknown; significance?: unknown }) => ({
            timestamp: String(e.timestamp || ""),
            event: String(e.event || ""),
            significance: String(e.significance || "")
          }))
        : [],
      recommendation: String(parsed.recommendation || "Review the session manually."),
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error("[ai.service] Failed to analyze behavior:", error);
    return null;
  }
}

export interface SessionSummaryResult {
  sessionName: string;
  totalCandidates: number;
  submittedCount: number;
  averageTrustScore: number;
  topPerformers: Array<{
    email: string;
    trustScore: number;
    codeQuality?: number;
    highlight: string;
  }>;
  flaggedCandidates: Array<{
    email: string;
    trustScore: number;
    reason: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  }>;
  overallInsight: string;
  recommendation: string;
  statisticsSummary: string;
  generatedAt: Date;
}

export async function generateSessionSummary({
  sessionName,
  problemTitle,
  durationMinutes,
  candidates
}: {
  sessionName: string;
  problemTitle: string;
  durationMinutes: number;
  candidates: Array<{
    email: string;
    trustScore: number;
    hasSubmitted: boolean;
    submittedAt?: string;
    leftSession: boolean;
    eventCount: number;
    tabSwitches: number;
    pastes: number;
    codeQualityScore?: number;
    timeComplexity?: string;
    codeSummary?: string;
  }>;
}): Promise<SessionSummaryResult | null> {
  if (!env.groqApiKey) {
    return null;
  }

  const groq = new Groq({ apiKey: env.groqApiKey });

  const candidateLines = candidates.map((c, i) =>
    `${i + 1}. ${c.email}
   - Trust Score: ${c.trustScore}/100
   - Submitted Code: ${c.hasSubmitted ? `Yes (at ${c.submittedAt ?? "unknown time"})` : "No"}
   - Left Session Early: ${c.leftSession ? "Yes" : "No"}
   - Behavior Events: ${c.eventCount} total | ${c.tabSwitches} tab switches | ${c.pastes} paste events
   - AI Code Quality Score: ${c.codeQualityScore !== undefined ? `${c.codeQualityScore}/100` : "Not reviewed"}
   - Time Complexity: ${c.timeComplexity ?? "N/A"}
   - Code Summary: ${c.codeSummary ?? "No submission"}`
  ).join("\n\n");

  const avgTrust = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.trustScore, 0) / candidates.length)
    : 0;

  const prompt = `You are an expert technical interview evaluator. Generate a comprehensive session summary report for the following coding interview session.

SESSION DETAILS:
- Session Name: ${sessionName}
- Problem: ${problemTitle}
- Duration: ${durationMinutes} minutes
- Total Candidates: ${candidates.length}
- Candidates Who Submitted: ${candidates.filter(c => c.hasSubmitted).length}
- Average Trust Score: ${avgTrust}/100

CANDIDATE DATA:
${candidateLines}

Based on the above data, return ONLY a valid JSON object (no markdown) with these exact fields:
- "overallInsight": a 3-4 sentence paragraph summarizing the overall session quality, candidate pool performance, and any notable patterns observed
- "statisticsSummary": a 2-3 sentence factual summary of the numbers (submission rate, average scores, etc.)
- "topPerformers": array of up to 3 best candidates, each with "email", "trustScore", "codeQuality" (number or null), "highlight" (one sentence why they stood out)
- "flaggedCandidates": array of candidates who need review, each with "email", "trustScore", "reason" (specific reason to review), "severity" ("LOW", "MEDIUM", or "HIGH")
- "recommendation": a 2-3 sentence actionable recommendation for the hiring team on next steps`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(responseText);

    const submittedCount = candidates.filter(c => c.hasSubmitted).length;

    return {
      sessionName,
      totalCandidates: candidates.length,
      submittedCount,
      averageTrustScore: avgTrust,
      topPerformers: Array.isArray(parsed.topPerformers)
        ? parsed.topPerformers.slice(0, 3).map((p: { email?: unknown; trustScore?: unknown; codeQuality?: unknown; highlight?: unknown }) => ({
            email: String(p.email || ""),
            trustScore: Number(p.trustScore || 0),
            codeQuality: p.codeQuality !== null && p.codeQuality !== undefined ? Number(p.codeQuality) : undefined,
            highlight: String(p.highlight || "")
          }))
        : [],
      flaggedCandidates: Array.isArray(parsed.flaggedCandidates)
        ? parsed.flaggedCandidates.map((f: { email?: unknown; trustScore?: unknown; reason?: unknown; severity?: unknown }) => ({
            email: String(f.email || ""),
            trustScore: Number(f.trustScore || 0),
            reason: String(f.reason || ""),
            severity: ["LOW", "MEDIUM", "HIGH"].includes(String(f.severity)) ? String(f.severity) as "LOW" | "MEDIUM" | "HIGH" : "MEDIUM"
          }))
        : [],
      overallInsight: String(parsed.overallInsight || ""),
      recommendation: String(parsed.recommendation || ""),
      statisticsSummary: String(parsed.statisticsSummary || ""),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error("[ai.service] Failed to generate session summary:", error);
    return null;
  }
}
