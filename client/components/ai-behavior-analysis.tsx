"use client";

import { useState } from "react";
import {
  ScanEye,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Siren,
  RefreshCw,
  Brain,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity
} from "lucide-react";

type KeyEvent = {
  timestamp: string;
  event: string;
  significance: string;
};

type BehaviorAnalysis = {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidencePercent: number;
  summary: string;
  suspiciousPatterns: string[];
  innocentPatterns: string[];
  keyEvents: KeyEvent[];
  recommendation: string;
  analyzedAt: string;
};

type AiBehaviorAnalysisProps = {
  sessionId: string;
  userId: string;
  userEmail: string;
  eventCount: number;
};

function getRiskConfig(level: BehaviorAnalysis["riskLevel"]) {
  switch (level) {
    case "CRITICAL":
      return {
        label: "CRITICAL RISK",
        Icon: Siren,
        iconColor: "text-rose-300",
        border: "border-rose-500/40",
        bg: "from-rose-500/15 to-rose-600/5",
        badge: "bg-rose-500/20 border-rose-400/50 text-rose-200",
        text: "text-rose-300",
        glow: "shadow-rose-950/30"
      };
    case "HIGH":
      return {
        label: "HIGH RISK",
        Icon: ShieldX,
        iconColor: "text-orange-300",
        border: "border-orange-500/40",
        bg: "from-orange-500/15 to-orange-600/5",
        badge: "bg-orange-500/20 border-orange-400/50 text-orange-200",
        text: "text-orange-300",
        glow: "shadow-orange-950/30"
      };
    case "MEDIUM":
      return {
        label: "MEDIUM RISK",
        Icon: ShieldAlert,
        iconColor: "text-amber-300",
        border: "border-amber-500/40",
        bg: "from-amber-500/15 to-amber-600/5",
        badge: "bg-amber-500/20 border-amber-400/50 text-amber-200",
        text: "text-amber-300",
        glow: "shadow-amber-950/30"
      };
    default:
      return {
        label: "LOW RISK",
        Icon: ShieldCheck,
        iconColor: "text-emerald-300",
        border: "border-emerald-500/40",
        bg: "from-emerald-500/15 to-emerald-600/5",
        badge: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
        text: "text-emerald-300",
        glow: "shadow-emerald-950/30"
      };
  }
}

function ConfidenceBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "bg-emerald-400" : percent >= 60 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-300">{percent}%</span>
    </div>
  );
}

export function AiBehaviorAnalysis({ sessionId, userId, userEmail, eventCount }: AiBehaviorAnalysisProps) {
  const [analysis, setAnalysis] = useState<BehaviorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/behavior-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to analyze behavior"); return; }
      setAnalysis(data.analysis);
    } catch {
      setError("Network error while analyzing behavior");
    } finally {
      setIsLoading(false);
    }
  }

  const risk = analysis ? getRiskConfig(analysis.riskLevel) : null;

  return (
    <div className={`rounded-3xl border shadow-2xl ${risk ? `${risk.border} bg-gradient-to-br ${risk.bg} ${risk.glow}` : "border-slate-700/40 bg-slate-900/80 shadow-slate-950/30"}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800/80">
            <ScanEye className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI Behavior Analysis</p>
            <p className="mt-1 text-xs text-slate-500">{userEmail} · {eventCount} behavior events recorded</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analysis && risk && (
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${risk.badge}`}>
              <risk.Icon className="h-3 w-3" />
              {risk.label}
            </span>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-slate-500 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : analysis ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Analyzing..." : analysis ? "Re-analyze" : "Run AI Analysis"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!analysis && !isLoading && (
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5 text-center">
            <p className="text-sm text-slate-400">
              Click <span className="font-semibold text-white">"Run AI Analysis"</span> to have Llama 3.3 analyze the behavior pattern of this candidate and produce a detailed risk assessment.
            </p>
          </div>
        </div>
      )}

      {analysis && risk && (
        <div className="space-y-4 px-6 pb-6">
          {/* Confidence + Summary */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Confidence</p>
              </div>
              <p className="text-xs text-slate-500">Analyzed {new Date(analysis.analyzedAt).toLocaleString()}</p>
            </div>
            <div className="mt-3"><ConfidenceBar percent={analysis.confidencePercent} /></div>
            <p className={`mt-4 text-sm font-medium leading-6 ${risk.text}`}>{analysis.summary}</p>
          </div>

          {/* Recommendation */}
          <div className={`rounded-2xl border p-4 ${risk.border} bg-slate-950/40`}>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Evaluator Recommendation</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white">{analysis.recommendation}</p>
          </div>

          {/* Key Events Timeline */}
          {analysis.keyEvents.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Key Events Timeline</p>
              </div>
              <div className="mt-3 space-y-3">
                {analysis.keyEvents.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">{idx + 1}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-medium text-slate-300">{event.timestamp}</span>
                        <span className={`text-xs font-semibold ${risk.text}`}>{event.event}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{event.significance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious + Innocent Patterns */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-300">Suspicious Patterns ({analysis.suspiciousPatterns.length})</p>
              </div>
              {analysis.suspiciousPatterns.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.suspiciousPatterns.map((pattern, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-5 text-rose-100/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-400">No suspicious patterns detected.</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">Innocent Patterns ({analysis.innocentPatterns.length})</p>
              </div>
              {analysis.innocentPatterns.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.innocentPatterns.map((pattern, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-5 text-emerald-100/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-400">No clearly innocent patterns noted.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
