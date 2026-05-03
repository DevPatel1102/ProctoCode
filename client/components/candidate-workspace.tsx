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
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState<"javascript" | "python">("javascript");
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      } else {
        setSessionDetails(matchingSession);
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

  useEffect(() => {
    if (!sessionDetails?.startedAt || !sessionDetails?.session?.durationMinutes) {
      return;
    }

    const durationMs = sessionDetails.session.durationMinutes * 60 * 1000;
    const startTime = new Date(sessionDetails.startedAt).getTime();
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeLeft("00:00");
        setIsSessionEnded(true);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [sessionDetails?.startedAt, sessionDetails?.session?.durationMinutes]);

  async function handleRunTestCases() {
    setIsSubmittingCode(true);
    setTestResults(null);
    setErrorMessage("");

    try {
      if (!currentCode) {
        setErrorMessage("Please write some code first.");
        setIsSubmittingCode(false);
        return;
      }

      const response = await fetch("/api/sandbox/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: currentLanguage,
          sessionId: currentSession?.sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to run test cases");
        return;
      }

      setTestResults(data.results);
    } catch (err) {
      setErrorMessage("Network error while running test cases");
    } finally {
      setIsSubmittingCode(false);
    }
  }

  async function handleSubmitCode() {
    if (!currentSession?.sessionId || !currentCode || isSubmitted || isSubmittingFinal) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit your code? You can only submit once and cannot change it afterwards."
    );
    if (!confirmed) return;

    setIsSubmittingFinal(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/sessions/submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          code: currentCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to submit code");
        return;
      }

      setIsSubmitted(true);
      // Auto-leave the session after successful submission
      await handleLeaveSession();
    } catch {
      setErrorMessage("Network error while submitting code");
    } finally {
      setIsSubmittingFinal(false);
    }
  }

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
                {timeLeft && (
                  <div className="flex items-center rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-medium text-white">
                    ⏱️ <span className="ml-2 tabular-nums text-cyan-300">{timeLeft}</span>
                  </div>
                )}
                <TrustScoreCard />
                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={isSubmittingFinal || isSubmitted || !currentCode || isSessionEnded}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${isSubmitted
                      ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  {isSubmitted ? "✅ Submitted" : isSubmittingFinal ? "Submitting..." : "Submit Code"}
                </button>
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
          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr]">

            {/* Problem Panel */}
            {sessionDetails?.session?.problemTitle ? (
              <div className="flex flex-col gap-4 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
                <h3 className="text-xl font-semibold text-white">
                  {sessionDetails.session.problemTitle}
                </h3>
                <div className="prose prose-invert text-sm text-slate-300">
                  <p className="whitespace-pre-wrap">{sessionDetails.session.problemDescription}</p>
                </div>

                {sessionDetails.session.testCases?.some((tc: any) => !tc.isHidden) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3">Public Test Cases</h4>
                    <div className="flex flex-col gap-3">
                      {sessionDetails.session.testCases
                        ?.filter((tc: any) => !tc.isHidden)
                        .map((tc: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                            <p className="text-xs text-slate-400 mb-1">Input:</p>
                            <pre className="text-sm text-white bg-slate-900 p-2 rounded">{tc.input}</pre>
                            <p className="text-xs text-slate-400 mt-2 mb-1">Expected Output:</p>
                            <pre className="text-sm text-white bg-slate-900 p-2 rounded">{tc.expectedOutput}</pre>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Code Sandbox Panel */}
            <div className="flex flex-col gap-4 relative min-w-0">
              <CodeSandbox
                onCodeChange={(code) => setCurrentCode(code)}
                onLanguageChange={(lang) => setCurrentLanguage(lang as "javascript" | "python")}
                headerActions={
                  sessionDetails?.session?.testCases?.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleRunTestCases}
                      disabled={isSubmittingCode}
                      className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSubmittingCode ? "Running Tests..." : "Run Test Cases"}
                    </button>
                  ) : null
                }
              />

              {sessionDetails?.session?.testCases?.length > 0 && testResults && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {testResults.map((res: any, idx: number) => (
                        <div key={idx} className={`rounded-xl border p-4 ${res.passed ? "border-emerald-400/30 bg-emerald-500/10" : "border-rose-400/30 bg-rose-500/10"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{res.passed ? "✅" : "❌"}</span>
                            <span className="font-medium text-white">Test Case {idx + 1} {res.isHidden ? "(Hidden)" : ""}</span>
                          </div>
                          {!res.passed && !res.isHidden && (
                            <div className="mt-3 grid gap-2 text-sm">
                              <div>
                                <span className="text-slate-400">Expected:</span>
                                <pre className="mt-1 bg-slate-950 p-2 rounded text-emerald-300">{res.expectedOutput}</pre>
                              </div>
                              <div>
                                <span className="text-slate-400">Actual:</span>
                                <pre className="mt-1 bg-slate-950 p-2 rounded text-rose-300">{res.actualOutput || res.error || "<No output>"}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                        ? "Your session time has expired or the admin has deactivated the session. You must leave now."
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
        </div>
      </SessionRulesGate>
    </div>
  );
}
