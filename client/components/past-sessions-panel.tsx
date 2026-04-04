"use client";

import { useEffect, useState } from "react";

type CandidateSession = {
  id: string;
  trustScore: number;
  lastActivity: string;
  leftAt: string | null;
  session: {
    id: string;
    sessionName: string;
    sessionCode: string;
    isActive: boolean;
    createdAt: string | null;
  } | null;
};

function getScoreTone(score: number) {
  if (score > 80) {
    return "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100";
  }

  if (score >= 50) {
    return "border-amber-500 bg-amber-500 text-slate-950 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100";
  }

  return "border-rose-600 bg-rose-600 text-white dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100";
}

export function PastSessionsPanel() {
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      setErrorMessage("");

      try {
        const response = await fetch("/api/sessions/mine", {
          cache: "no-store"
        });

        const data = (await response.json()) as {
          sessions?: CandidateSession[];
          message?: string;
        };

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(data.message ?? "Failed to load past sessions");
          }
          return;
        }

        if (isMounted) {
          setSessions(data.sessions ?? []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Unable to reach the session history service");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="panel-surface rounded-[2rem] p-6 sm:p-7">
      <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
        Session History
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
        Your past sessions
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
        Review sessions you joined earlier and the trust score recorded for each one.
      </p>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5"
            >
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="mt-3 h-4 w-24 rounded bg-white/5" />
              <div className="mt-4 h-11 rounded-2xl bg-white/5" />
              <div className="mt-4 h-4 w-4/5 rounded bg-white/5" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/5" />
            </div>
          ))
        ) : sessions.length ? (
          sessions.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.6rem] border border-white/10 bg-slate-950/80 p-5 transition hover:border-cyan-300/20 hover:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-white">
                  {item.session?.sessionName ?? "Unknown Session"}
                </p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${getScoreTone(item.trustScore)}`}
                >
                  {item.trustScore}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Code: {item.session?.sessionCode ?? "N/A"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Last Activity
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {new Date(item.lastActivity).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {item.session?.isActive
                      ? item.leftAt
                        ? "Left active session"
                        : "Currently joined"
                      : "Session closed"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                Trust Score
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {item.trustScore}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-300">No joined sessions yet.</p>
        )}
      </div>
    </div>
  );
}
