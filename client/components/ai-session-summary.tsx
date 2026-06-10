"use client";

import { useState } from "react";
import {
  Bot,
  Users,
  CheckCircle2,
  ShieldCheck,
  TriangleAlert,
  BarChart3,
  TrendingUp,
  Trophy,
  Briefcase,
  RefreshCw,
  FileDown,
  X,
  Loader2,
  Medal
} from "lucide-react";

type TopPerformer = {
  email: string;
  trustScore: number;
  codeQuality?: number;
  highlight: string;
};

type FlaggedCandidate = {
  email: string;
  trustScore: number;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

type SessionSummary = {
  sessionName: string;
  totalCandidates: number;
  submittedCount: number;
  averageTrustScore: number;
  topPerformers: TopPerformer[];
  flaggedCandidates: FlaggedCandidate[];
  overallInsight: string;
  recommendation: string;
  statisticsSummary: string;
  generatedAt: string;
};

function SeverityBadge({ severity }: { severity: FlaggedCandidate["severity"] }) {
  const styles = {
    HIGH: "bg-rose-500/20 border-rose-400/40 text-rose-200",
    MEDIUM: "bg-amber-500/20 border-amber-400/40 text-amber-200",
    LOW: "bg-slate-500/20 border-slate-400/40 text-slate-300"
  };
  const sevColor = {
    HIGH: "text-rose-400",
    MEDIUM: "text-amber-400",
    LOW: "text-slate-400"
  };
  return (
    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[severity]}`}>
      <TriangleAlert className={`h-3 w-3 ${sevColor[severity]}`} />
      {severity}
    </span>
  );
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={size * 0.22} fill="white" fontWeight="600">
        {score}
      </text>
    </svg>
  );
}

export function AiSessionSummaryButton({ sessionId, sessionName }: { sessionId: string; sessionName: string }) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json() as { summary?: SessionSummary; message?: string };

      if (!response.ok) {
        setError(data.message ?? "Failed to generate summary");
        return;
      }

      setSummary(data.summary!);
      setIsOpen(true);
    } catch {
      setError("Network error while generating summary");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={summary ? () => setIsOpen(true) : handleGenerate}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
        {isLoading ? "Generating..." : summary ? "View AI Summary" : "AI Summary"}
      </button>

      {error && (
        <span className="text-xs text-rose-300">{error}</span>
      )}

      {/* Modal overlay */}
      {isOpen && summary && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/50">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-violet-300">AI Session Report</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{summary.sessionName}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Generated {new Date(summary.generatedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Stats bar */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Candidates", value: summary.totalCandidates, Icon: Users, color: "text-cyan-400" },
                  { label: "Submitted", value: `${summary.submittedCount}/${summary.totalCandidates}`, Icon: CheckCircle2, color: "text-emerald-400" },
                  { label: "Avg Trust", value: `${summary.averageTrustScore}%`, Icon: ShieldCheck, color: "text-violet-400" },
                  { label: "Flagged", value: summary.flaggedCandidates.length, Icon: TriangleAlert, color: "text-rose-400" }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center">
                    <stat.Icon className={`h-5 w-5 mx-auto ${stat.color}`} />
                    <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Overall insight */}
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Overall Insight</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{summary.overallInsight}</p>
              </div>

              {/* Stats summary */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Statistics</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{summary.statisticsSummary}</p>
              </div>

              {/* Top performers */}
              {summary.topPerformers.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Top Performers</p>
                  </div>
                  <div className="space-y-3">
                    {summary.topPerformers.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                        <ScoreRing score={p.trustScore} size={52} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white truncate">{p.email}</p>
                            {p.codeQuality !== undefined && (
                              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                Code: {p.codeQuality}/100
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-emerald-200/80">{p.highlight}</p>
                        </div>
                        <Medal className={`h-5 w-5 shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-amber-700"}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged candidates */}
              {summary.flaggedCandidates.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <TriangleAlert className="h-3.5 w-3.5 text-rose-400" />
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Flagged for Review</p>
                  </div>
                  <div className="space-y-3">
                    {summary.flaggedCandidates.map((f, i) => (
                      <div key={i} className="flex items-start gap-4 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4">
                        <ScoreRing score={f.trustScore} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white truncate">{f.email}</p>
                            <SeverityBadge severity={f.severity} />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-rose-200/80">{f.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Hiring Recommendation</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white">{summary.recommendation}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open("", "_blank", "width=900,height=700");
                    if (!win) return;

                    const topRows = summary.topPerformers.map((p, i) =>
                      `<tr>
                        <td>${["🥇", "🥈", "🥉"][i] ?? ""} ${p.email}</td>
                        <td style="text-align:center">${p.trustScore}/100</td>
                        <td style="text-align:center">${p.codeQuality !== undefined ? `${p.codeQuality}/100` : "—"}</td>
                        <td>${p.highlight}</td>
                      </tr>`
                    ).join("");

                    const flagRows = summary.flaggedCandidates.map((f) => {
                      const sevColor = f.severity === "HIGH" ? "#dc2626" : f.severity === "MEDIUM" ? "#d97706" : "#64748b";
                      return `<tr>
                        <td>${f.email}</td>
                        <td style="text-align:center;color:${sevColor};font-weight:600">${f.severity}</td>
                        <td>${f.trustScore}/100</td>
                        <td>${f.reason}</td>
                      </tr>`;
                    }).join("");

                    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>AI Session Summary — ${summary.sessionName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
    h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 12px; margin-bottom: 32px; }
    .badge { display:inline-block; background:#7c3aed; color:#fff; font-size:10px; font-weight:700; padding:2px 10px; border-radius:999px; letter-spacing:0.1em; margin-bottom:16px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
    .stat-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:center; }
    .stat-num { font-size:24px; font-weight:700; color:#0f172a; }
    .stat-label { font-size:11px; color:#64748b; margin-top:4px; }
    h2 { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#7c3aed; margin:24px 0 10px; }
    .insight-box { background:#faf5ff; border-left:4px solid #7c3aed; padding:14px 16px; border-radius:0 8px 8px 0; color:#1e293b; margin-bottom:8px; }
    .stats-box { background:#f8fafc; border-left:4px solid #94a3b8; padding:14px 16px; border-radius:0 8px 8px 0; color:#475569; }
    .rec-box { background:#f0fdfa; border-left:4px solid #0891b2; padding:14px 16px; border-radius:0 8px 8px 0; color:#1e293b; }
    table { width:100%; border-collapse:collapse; margin-top:8px; font-size:12px; }
    th { background:#f1f5f9; color:#475569; font-weight:600; padding:8px 12px; text-align:left; border-bottom:2px solid #e2e8f0; }
    td { padding:8px 12px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
    tr:last-child td { border-bottom:none; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:11px; display:flex; justify-content:space-between; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="badge">PROCTOCODE · AI REPORT</div>
  <h1>${summary.sessionName}</h1>
  <p class="subtitle">AI-generated session summary &nbsp;·&nbsp; ${new Date(summary.generatedAt).toLocaleString()}</p>

  <div class="stats-grid">
    <div class="stat-box"><div class="stat-num">${summary.totalCandidates}</div><div class="stat-label">Total Candidates</div></div>
    <div class="stat-box"><div class="stat-num">${summary.submittedCount}/${summary.totalCandidates}</div><div class="stat-label">Submitted</div></div>
    <div class="stat-box"><div class="stat-num">${summary.averageTrustScore}%</div><div class="stat-label">Avg Trust Score</div></div>
    <div class="stat-box"><div class="stat-num">${summary.flaggedCandidates.length}</div><div class="stat-label">Flagged</div></div>
  </div>

  <h2>📊 Overall Insight</h2>
  <div class="insight-box">${summary.overallInsight}</div>

  <h2>📈 Statistics</h2>
  <div class="stats-box">${summary.statisticsSummary}</div>

  ${summary.topPerformers.length > 0 ? `
  <h2>🏆 Top Performers</h2>
  <table>
    <thead><tr><th>Candidate</th><th>Trust Score</th><th>Code Quality</th><th>Highlight</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>` : ""}

  ${summary.flaggedCandidates.length > 0 ? `
  <h2>⚠️ Flagged for Review</h2>
  <table>
    <thead><tr><th>Candidate</th><th>Severity</th><th>Trust Score</th><th>Reason</th></tr></thead>
    <tbody>${flagRows}</tbody>
  </table>` : ""}

  <h2>💼 Hiring Recommendation</h2>
  <div class="rec-box">${summary.recommendation}</div>

  <div class="footer">
    <span>ProctoCode · AI Session Summary</span>
    <span>Generated ${new Date(summary.generatedAt).toLocaleString()}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
                    win.document.close();
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-violet-500/20 border border-violet-400/30 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-500/30"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
