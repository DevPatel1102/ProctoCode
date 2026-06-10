"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Download,
  Bot,
  Target,
  Pencil,
  Timer,
  Pin,
  FileText,
  FlaskConical,
  Rocket,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  PowerOff,
  Key,
  AlertTriangle
} from "lucide-react";

import { AiSessionSummaryButton } from "@/components/ai-session-summary";

type SessionSummary = {
  id: string;
  sessionName: string;
  sessionCode: string;
  problemTitle?: string;
  durationMinutes?: number;
  isActive: boolean;
  createdAt: string;
};

type SessionUser = {
  id: string;
  userId: string;
  email: string;
  trustScore: number;
  lastActivity: string;
  leftAt: string | null;
};

function getScoreTone(score: number) {
  if (score > 80) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }

  if (score >= 50) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }

  return "border-rose-400/30 bg-rose-500/10 text-rose-200";
}

export function AdminDashboard() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionUsers, setSessionUsers] = useState<Record<string, SessionUser[]>>({});
  const [generatedCode, setGeneratedCode] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; isHidden: boolean }>>([
    { input: "", expectedOutput: "", isHidden: false }
  ]);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeActionSessionId, setActiveActionSessionId] = useState<string | null>(
    null
  );
  // AI Problem Generator state
  const [aiDifficulty, setAiDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [aiTopic, setAiTopic] = useState("Arrays");
  const [aiLanguage, setAiLanguage] = useState("javascript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [justGenerated, setJustGenerated] = useState(false);

  const totalCandidates = Object.values(sessionUsers).reduce(
    (count, users) => count + users.length,
    0
  );

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const response = await fetch("/api/sessions", {
          cache: "no-store"
        });

        const data = (await response.json()) as {
          sessions?: SessionSummary[];
          message?: string;
        };

        if (!response.ok) {
          if (isMounted) {
            setLoadError(data.message ?? "Failed to load sessions");
          }
          return;
        }

        if (isMounted) {
          setSessions(data.sessions ?? []);
          setLoadError("");
        }
      } catch {
        if (isMounted) {
          setLoadError("Unable to load admin sessions right now");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const interval = setInterval(() => {
      void loadSessions();
    }, 5000);

    void loadSessions();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!sessions.length) {
      return;
    }

    const fetchUsers = async (sessionId: string) => {
      const response = await fetch(`/api/sessions/${sessionId}/users`, {
        cache: "no-store"
      });

      const data = (await response.json()) as {
        users?: SessionUser[];
      };

      if (!response.ok) {
        return;
      }

      setSessionUsers((current) => ({
        ...current,
        [sessionId]: data.users ?? []
      }));
    };

    void Promise.all(sessions.map((session) => fetchUsers(session.id)));
  }, [sessions]);

  async function handleCreateSession() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionName,
          problemTitle,
          problemDescription,
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
          testCases: testCases.filter((tc) => tc.input || tc.expectedOutput)
        })
      });

      const data = (await response.json()) as {
        message?: string;
        sessionCode?: string;
      };

      if (!response.ok) {
        setMessage(data.message ?? "Failed to create session");
        setIsCreating(false);
        return;
      }

      setGeneratedCode(data.sessionCode ?? "");
      setSessionName("");
      setProblemTitle("");
      setProblemDescription("");
      setDurationMinutes("60");
      setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);

      const refreshResponse = await fetch("/api/sessions", {
        cache: "no-store"
      });
      const refreshData = (await refreshResponse.json()) as {
        sessions?: SessionSummary[];
      };
      setSessions(refreshData.sessions ?? []);
      setLoadError("");
    } catch {
      setMessage("Unable to create a session right now");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleGenerateProblem() {
    setIsGenerating(true);
    setGenerateError("");
    setJustGenerated(false);

    try {
      const response = await fetch("/api/ai/generate-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: aiDifficulty, topic: aiTopic, language: aiLanguage })
      });

      const data = await response.json() as {
        problem?: {
          title: string;
          description: string;
          constraints: string[];
          examples: Array<{ input: string; output: string; explanation?: string }>;
          testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
          difficulty: string;
          topic: string;
        };
        message?: string;
      };

      if (!response.ok) {
        setGenerateError(data.message ?? "Failed to generate problem");
        return;
      }

      if (data.problem) {
        setProblemTitle(data.problem.title);
        const constraintText = data.problem.constraints.length
          ? `\n\nConstraints:\n${data.problem.constraints.map((c) => `• ${c}`).join("\n")}`
          : "";
        const exampleText = data.problem.examples.length
          ? `\n\nExamples:\n${data.problem.examples.map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}${ex.explanation ? `\nExplanation: ${ex.explanation}` : ""}`).join("\n\n")}`
          : "";
        setProblemDescription(data.problem.description + constraintText + exampleText);
        if (data.problem.testCases.length > 0) {
          setTestCases(data.problem.testCases);
        }
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 4000);
      }
    } catch {
      setGenerateError("Network error while generating problem");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDeactivateSession(sessionId: string) {
    setActiveActionSessionId(sessionId);
    setMessage("");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/deactivate`, {
        method: "PATCH"
      });

      if (!response.ok) {
        setMessage("Unable to deactivate this session");
        return;
      }

      const refreshResponse = await fetch("/api/sessions", {
        cache: "no-store"
      });
      const refreshData = (await refreshResponse.json()) as {
        sessions?: SessionSummary[];
      };
      setSessions(refreshData.sessions ?? []);
    } finally {
      setActiveActionSessionId(null);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    const confirmed = window.confirm(
      "Delete this session and all its logs, user history, and trust scores?"
    );

    if (!confirmed) {
      return;
    }

    setActiveActionSessionId(sessionId);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        setMessage("Unable to delete this session history");
        return;
      }

      const refreshResponse = await fetch("/api/sessions", {
        cache: "no-store"
      });
      const refreshData = (await refreshResponse.json()) as {
        sessions?: SessionSummary[];
      };
      setSessions(refreshData.sessions ?? []);
      setSessionUsers((current) => {
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
    } finally {
      setActiveActionSessionId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel-surface rounded-[1.8rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Total Sessions
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{sessions.length}</p>
        </div>
        <div className="panel-surface rounded-[1.8rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Active Rooms
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {sessions.filter((session) => session.isActive).length}
          </p>
        </div>
        <div className="panel-surface rounded-[1.8rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Joined Candidates
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalCandidates}</p>
        </div>
        <div className="panel-surface rounded-[1.8rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Latest Code
          </p>
          <p className="mt-3 text-lg font-semibold tracking-[0.24em] text-white">
            {generatedCode || "Awaiting new session"}
          </p>
        </div>
      </div>

      <div className="panel-surface rounded-[2rem] p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Admin Control</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Create Session</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Spin up a new interview room with isolated logs and trust scoring.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
            <Target className="h-6 w-6 text-cyan-400" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-8">

          {/* ── Row 1: Session basics ── */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                <Pencil className="h-3 w-3" /> Session Name
              </label>
              <input
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                placeholder="e.g. Technical Interview Round 1"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                <Timer className="h-3 w-3" /> Duration (minutes)
              </label>
              <input
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                type="number"
                placeholder="60"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5" />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-600">Problem Setup</p>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* ── AI Problem Generator ── */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent p-5">
            {/* subtle glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                <Bot className="h-5 w-5 text-violet-300" />
              </div>
                <div>
                  <p className="font-semibold text-violet-100">AI Problem Generator</p>
                  <p className="text-xs text-slate-400">Auto-generate a full problem with test cases</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateProblem}
                disabled={isGenerating}
                className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generate with AI</span>
                )}
              </button>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-400"
                >
                  <option value="Easy">🟢 Easy</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Hard">🔴 Hard</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Topic</label>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Arrays, DP"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Language</label>
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-400"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>
            {justGenerated && (
              <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                <span className="text-sm">✅</span>
                <p className="text-xs font-medium text-emerald-300">Problem generated! All fields have been auto-filled below.</p>
              </div>
            )}
            {generateError && (
              <div className="relative mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2">
                <p className="text-xs text-rose-300">{generateError}</p>
              </div>
            )}
          </div>

          {/* ── Problem Title ── */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              <Pin className="h-3 w-3" /> Problem Title
            </label>
            <input
              value={problemTitle}
              onChange={(event) => setProblemTitle(event.target.value)}
              placeholder="e.g. Two Sum, Longest Common Subsequence"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
            />
          </div>

          {/* ── Problem Description ── */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              <FileText className="h-3 w-3" /> Problem Description
            </label>
            <textarea
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              placeholder="Describe the problem, examples, and constraints candidates need to solve..."
              rows={6}
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
            />
          </div>

          {/* ── Test Cases ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                <FlaskConical className="h-3 w-3" /> Test Cases
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {testCases.length}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }])}
                className="flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                <Plus className="h-3 w-3" /> Add Test Case
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {testCases.map((tc, idx) => (
                <div key={idx} className="group relative rounded-2xl border border-white/5 bg-slate-950/60 p-4 transition hover:border-white/10">
                  {/* Case number badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-400">
                      Case #{idx + 1}
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 transition hover:text-slate-300">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => {
                              const newTcs = [...testCases];
                              newTcs[idx].isHidden = e.target.checked;
                              setTestCases(newTcs);
                            }}
                            className="sr-only"
                          />
                          <div className={`h-4 w-4 rounded border transition ${tc.isHidden ? "border-violet-400 bg-violet-500" : "border-white/20 bg-slate-900"} flex items-center justify-center`}>
                            {tc.isHidden && <span className="text-[10px] text-white">✓</span>}
                          </div>
                        </div>
                        🔒 Hidden from candidates
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newTcs = testCases.filter((_, i) => i !== idx);
                          setTestCases(newTcs.length ? newTcs : [{ input: "", expectedOutput: "", isHidden: false }]);
                        }}
                        className="text-xs text-slate-600 transition hover:text-rose-400"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Input (stdin)</span>
                      <textarea
                        value={tc.input}
                        onChange={(e) => {
                          const newTcs = [...testCases];
                          newTcs[idx].input = e.target.value;
                          setTestCases(newTcs);
                        }}
                        placeholder="e.g. [1, 2, 3]"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2 font-mono text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Expected Output (stdout)</span>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const newTcs = [...testCases];
                          newTcs[idx].expectedOutput = e.target.value;
                          setTestCases(newTcs);
                        }}
                        placeholder="e.g. 6"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2 font-mono text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={isCreating || !sessionName.trim() || !problemTitle.trim()}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:from-cyan-300 hover:to-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative flex items-center justify-center gap-2">
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating session...</>
                ) : (
                  <><Rocket className="h-4 w-4" /> Create New Session</>
                )}
              </span>
            </button>
            {(!sessionName.trim() || !problemTitle.trim()) && (
              <p className="text-xs text-slate-600">Session name and problem title are required.</p>
            )}
          </div>
        </div>

        {generatedCode ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-teal-300/30 bg-teal-400/10 px-5 py-4">
            <Key className="h-5 w-5 text-teal-400 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-400">Session Code Created</p>
              <p className="mt-0.5 font-mono text-lg font-bold tracking-[0.3em] text-white">{generatedCode}</p>
            </div>
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {loadError}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30"
            >
              <div className="h-6 w-40 rounded bg-white/10" />
              <div className="mt-3 h-4 w-52 rounded bg-white/5" />
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="h-32 rounded-[1.5rem] bg-white/5" />
                <div className="h-32 rounded-[1.5rem] bg-white/5" />
                <div className="h-32 rounded-[1.5rem] bg-white/5" />
              </div>
            </div>
          ))
        ) : sessions.length ? sessions.map((session) => (
          <article
            key={session.id}
            className="panel-surface rounded-[2rem] p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                  {session.sessionName}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Session {session.sessionCode}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Created {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-slate-200">
                  {session.isActive ? "Active" : "Inactive"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `/api/sessions/${session.id}/report`;
                    link.download = `session_report_${session.sessionCode}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
                >
                  <Download className="h-3.5 w-3.5" /> Download Report
                </button>
                <AiSessionSummaryButton
                  sessionId={session.id}
                  sessionName={session.sessionName}
                />
                <button
                  type="button"
                  onClick={() => handleDeactivateSession(session.id)}
                  disabled={!session.isActive || activeActionSessionId === session.id}
                  className="flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  {session.isActive
                    ? activeActionSessionId === session.id ? "Updating..." : "Deactivate"
                    : "Deactivated"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(session.id)}
                  disabled={activeActionSessionId === session.id}
                  className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-600/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {activeActionSessionId === session.id ? "Working..." : "Delete History"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(sessionUsers[session.id] ?? []).length ? (
                sessionUsers[session.id].map((user) => (
                  <Link
                    key={user.id}
                    href={`/admin/sessions/${session.id}/users/${user.userId}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition hover:border-teal-300 hover:bg-teal-400/10"
                  >
                    <p className="font-medium text-white">{user.email}</p>
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 text-sm ${getScoreTone(user.trustScore)}`}
                    >
                      Trust Score: {user.trustScore}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Last activity: {new Date(user.lastActivity).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Status: {user.leftAt ? "Left session" : "In session"}
                    </p>
                    <p className="mt-2 text-xs text-teal-300">
                      Open live monitor
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-300">No users joined yet.</p>
              )}
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-sm text-slate-300 shadow-xl shadow-slate-950/30">
            No sessions created by this admin yet.
          </div>
        )}
      </div>
    </section>
  );
}
