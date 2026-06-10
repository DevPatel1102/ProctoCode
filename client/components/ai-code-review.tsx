"use client";

import { useState } from "react";
import {
  Bot,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Clock,
  Zap,
  MemoryStick,
  BookOpen,
  Code2,
  FileText,
  Loader2
} from "lucide-react";

type CodeReviewData = {
  qualityScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  readability: string;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
  reviewedAt: string;
};

type AiCodeReviewProps = {
  sessionId: string;
  userId: string;
  userEmail: string;
  initialReview?: CodeReviewData | null;
  hasSubmittedCode: boolean;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-rose-300";
}

function getScoreBg(score: number) {
  if (score >= 80) return "from-emerald-500/20 to-emerald-600/5 border-emerald-400/30";
  if (score >= 60) return "from-amber-500/20 to-amber-600/5 border-amber-400/30";
  if (score >= 40) return "from-orange-500/20 to-orange-600/5 border-orange-400/30";
  return "from-rose-500/20 to-rose-600/5 border-rose-400/30";
}

function getReadabilityBadge(readability: string) {
  const lower = readability.toLowerCase();
  if (lower === "excellent") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (lower === "good") return "border-teal-400/30 bg-teal-500/10 text-teal-200";
  if (lower === "fair") return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  return "border-rose-400/30 bg-rose-500/10 text-rose-200";
}

export function AiCodeReview({
  sessionId,
  userId,
  userEmail,
  initialReview,
  hasSubmittedCode
}: AiCodeReviewProps) {
  const [review, setReview] = useState<CodeReviewData | null>(initialReview ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTriggerReview() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to generate AI review"); return; }
      setReview(data.review);
    } catch {
      setError("Network error while generating review");
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasSubmittedCode) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800">
            <Bot className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">AI Code Review</p>
            <p className="text-xs text-slate-400">Waiting for code submission from {userEmail}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20">
              <Bot className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Code Review</p>
              <p className="text-xs text-slate-400">{userEmail} has submitted code — ready for AI analysis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerReview}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {isLoading ? "Analyzing..." : "Generate AI Review"}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (review.qualityScore / 100) * circumference;

  return (
    <div className="rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_40%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.95))] p-6 shadow-2xl shadow-violet-950/20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20">
            <Bot className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">AI Code Review</p>
            <p className="mt-1 text-xs text-slate-400">Analyzed {new Date(review.reviewedAt).toLocaleString()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTriggerReview}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isLoading ? "Re-analyzing..." : "Re-analyze"}
        </button>
      </div>

      {/* Score + Metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`flex flex-col items-center justify-center rounded-2xl border bg-gradient-to-b p-5 ${getScoreBg(review.qualityScore)}`}>
          <div className="relative h-24 w-24">
            <svg className="-rotate-90" viewBox="0 0 100 100" width="96" height="96">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                className={`transition-all duration-1000 ${getScoreColor(review.qualityScore)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(review.qualityScore)}`}>{review.qualityScore}</span>
            </div>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Quality Score</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time Complexity</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-cyan-300">{review.timeComplexity}</p>
          <p className="mt-1 text-xs text-slate-400">Runtime efficiency</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center gap-2">
            <MemoryStick className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Space Complexity</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-teal-300">{review.spaceComplexity}</p>
          <p className="mt-1 text-xs text-slate-400">Memory usage</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Readability</p>
          </div>
          <div className="mt-3">
            <span className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${getReadabilityBadge(review.readability)}`}>
              {review.readability}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Code clarity</p>
        </div>
      </div>

      {/* Approach */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-slate-500" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Solution Approach</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-white">{review.approach}</p>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-violet-400" />
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">AI Summary</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-200">{review.summary}</p>
      </div>

      {/* Issues + Strengths + Suggestions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-300">Issues ({review.issues.length})</p>
          </div>
          {review.issues.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {review.issues.map((issue, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-5 text-rose-100/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No issues detected — great job!</p>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">Strengths ({review.strengths.length})</p>
          </div>
          {review.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {review.strengths.map((s, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-5 text-emerald-100/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No strengths noted.</p>
          )}
        </div>

        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-300">Suggestions ({review.suggestions.length})</p>
          </div>
          {review.suggestions.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {review.suggestions.map((s, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-5 text-sky-100/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No suggestions — code is well-optimized.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
