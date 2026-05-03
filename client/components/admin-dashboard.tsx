"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

      <div className="panel-surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Admin Control
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Create session</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Each session is a clean interview room with isolated logs and trust scores.
            </p>
          </div>
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                placeholder="Session Name (e.g. Technical Interview)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />
              <input
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                type="number"
                placeholder="Duration (Minutes)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </div>
            
            <input
              value={problemTitle}
              onChange={(event) => setProblemTitle(event.target.value)}
              placeholder="Coding Problem Title"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            />
            
            <textarea
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              placeholder="Problem Description / Requirements"
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Test Cases</h3>
                <button
                  type="button"
                  onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }])}
                  className="text-xs text-cyan-300 hover:text-cyan-200"
                >
                  + Add Test Case
                </button>
              </div>
              {testCases.map((tc, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-950/50 p-4 sm:flex-row sm:items-start">
                  <textarea
                    value={tc.input}
                    onChange={(e) => {
                      const newTcs = [...testCases];
                      newTcs[idx].input = e.target.value;
                      setTestCases(newTcs);
                    }}
                    placeholder="Input (stdin)"
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                  />
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      const newTcs = [...testCases];
                      newTcs[idx].expectedOutput = e.target.value;
                      setTestCases(newTcs);
                    }}
                    placeholder="Expected Output (stdout)"
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                  />
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => {
                          const newTcs = [...testCases];
                          newTcs[idx].isHidden = e.target.checked;
                          setTestCases(newTcs);
                        }}
                        className="rounded border-white/20 bg-slate-950"
                      />
                      Hidden
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newTcs = testCases.filter((_, i) => i !== idx);
                        setTestCases(newTcs.length ? newTcs : [{ input: "", expectedOutput: "", isHidden: false }]);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCreateSession}
              disabled={isCreating || !sessionName.trim() || !problemTitle.trim()}
              className="mt-2 w-full sm:w-auto self-start rounded-2xl bg-cyan-300 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? "Creating..." : "Create New Session"}
            </button>
          </div>
        </div>

        {generatedCode ? (
          <div className="mt-5 rounded-2xl border border-teal-300/30 bg-teal-400/10 px-4 py-4 text-sm text-teal-100">
            Latest session code: <span className="font-semibold">{generatedCode}</span>
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            {loadError}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            {message}
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
                  className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
                >
                  📥 Download Report
                </button>
                <button
                  type="button"
                  onClick={() => handleDeactivateSession(session.id)}
                  disabled={!session.isActive || activeActionSessionId === session.id}
                  className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
                >
                  {session.isActive
                    ? activeActionSessionId === session.id
                      ? "Updating..."
                      : "Deactivate"
                    : "Deactivated"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(session.id)}
                  disabled={activeActionSessionId === session.id}
                  className="rounded-2xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-600/30"
                >
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
