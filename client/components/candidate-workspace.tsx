"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { CodeSandbox } from "@/components/code-sandbox";
import { PastSessionsPanel } from "@/components/past-sessions-panel";
import { SessionRulesGate } from "@/components/session-rules-gate";
import { TrustScoreCard } from "@/components/trust-score-card";

export function CandidateWorkspace() {
  const router = useRouter();
  const { currentSession, setCurrentSession } = useSession();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isTrustScoreLocked, setIsTrustScoreLocked] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLeaveSession() {
    if (!currentSession || isLeaving) {
      return;
    }

    setIsLeaving(true);
    setErrorMessage("");

    const response = await fetch("/api/sessions/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: currentSession.sessionId
      })
    });

    if (!response.ok) {
      setErrorMessage("We could not leave the session right now. Please try again.");
      setIsLeaving(false);
      return;
    }

    setCurrentSession(null);
    router.replace("/dashboard");
    router.refresh();
  }

  useEffect(() => {
    if (!currentSession?.sessionId) {
      setIsTrustScoreLocked(false);
      setIsSessionEnded(false);
      return;
    }

    let isMounted = true;

    const loadCurrentTrustScore = async () => {
      const response = await fetch(
        `/api/trust-score/current?sessionId=${currentSession.sessionId}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { trustScore?: number };

      if (isMounted && typeof data.trustScore === "number") {
        setIsTrustScoreLocked(data.trustScore <= 0);
      }
    };

    const handleTrustScoreUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ trustScore: number }>;

      if (customEvent.detail.trustScore <= 0) {
        setIsTrustScoreLocked(true);
      }
    };

    void loadCurrentTrustScore();
    window.addEventListener("trust-score:updated", handleTrustScoreUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("trust-score:updated", handleTrustScoreUpdate);
    };
  }, [currentSession?.sessionId]);

  useEffect(() => {
    if (!currentSession?.sessionId) {
      setIsSessionEnded(false);
      return;
    }

    let isMounted = true;

    const checkSessionState = async () => {
      const response = await fetch("/api/sessions/mine", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        sessions?: Array<{
          session?: {
            id: string;
            isActive: boolean;
          } | null;
        }>;
      };

      const matchingSession = (data.sessions ?? []).find(
        (session) => session.session?.id === currentSession.sessionId
      );

      if (!isMounted) {
        return;
      }

      if (!matchingSession || matchingSession.session?.isActive === false) {
        setIsSessionEnded(true);
      }
    };

    void checkSessionState();
    const interval = window.setInterval(() => {
      void checkSessionState();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [currentSession?.sessionId]);

  if (!currentSession) {
    return (
      <div className="space-y-6">
        <div className="panel-surface rounded-[2rem] p-7 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Candidate Dashboard
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                No active session right now
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                You have left the current interview session. You can join a new one at
                any time, and your previous session records remain available below.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="panel-muted p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Next Step
                </p>
                <p className="mt-2 text-sm text-white">Join another session</p>
              </div>
              <div className="panel-muted p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  History
                </p>
                <p className="mt-2 text-sm text-white">Review trust score outcomes</p>
              </div>
            </div>
          </div>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Join Another Session
          </Link>
        </div>
        <PastSessionsPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SessionRulesGate>
        <div className="space-y-6">
          <div className="panel-surface rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                  Student Coding Page
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Session {currentSession.sessionCode}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Work inside the monitored editor, keep your trust score healthy, and
                  leave only when your interview task is complete.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <TrustScoreCard />
                <button
                  type="button"
                  onClick={handleLeaveSession}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-rose-300 hover:text-rose-200"
                >
                  Leave Session
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <CodeSandbox />
            {isSessionEnded || isTrustScoreLocked ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl border border-rose-400/30 bg-slate-950/95 p-6">
                <div className="w-full max-w-lg rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center shadow-2xl shadow-rose-950/20">
                  <p className="text-sm uppercase tracking-[0.3em] text-rose-300">
                    Session Terminated
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">
                    {isSessionEnded
                      ? "This session has ended"
                      : "Trust score reached zero"}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-rose-100/90">
                    {isSessionEnded
                      ? "The admin has deactivated this session. You can no longer continue and must leave the session now."
                      : "Your session can no longer continue because the rule-violation threshold has been reached. You must leave this session now."}
                  </p>
                  <button
                    type="button"
                    onClick={handleLeaveSession}
                    disabled={isLeaving}
                    className="mt-6 rounded-2xl bg-rose-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLeaving ? "Leaving..." : "Leave Session"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SessionRulesGate>
    </div>
  );
}
