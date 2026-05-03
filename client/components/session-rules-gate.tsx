"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";

type SessionRulesGateProps = {
  children: React.ReactNode;
};

function getStorageKey(sessionId: string) {
  return `pc_rules_accepted_${sessionId}`;
}

export function SessionRulesGate({ children }: SessionRulesGateProps) {
  const { currentSession } = useSession();
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false);

  useEffect(() => {
    if (!currentSession?.sessionId) {
      setHasAcceptedRules(false);
      return;
    }

    const accepted = window.localStorage.getItem(
      getStorageKey(currentSession.sessionId)
    );
    setHasAcceptedRules(accepted === "true");
  }, [currentSession?.sessionId]);

  async function handleAcceptRules() {
    if (!currentSession?.sessionId) {
      return;
    }

    setIsRequestingFullscreen(true);

    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be denied by browser or platform rules. We still continue.
    } finally {
      window.localStorage.setItem(getStorageKey(currentSession.sessionId), "true");
      setHasAcceptedRules(true);
      setIsRequestingFullscreen(false);
    }
  }

  if (!currentSession) {
    return <>{children}</>;
  }

  if (hasAcceptedRules) {
    return <>{children}</>;
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_22%),linear-gradient(180deg,_rgba(15,23,42,0.97),_rgba(2,6,23,0.98))] shadow-2xl shadow-cyan-950/20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_20%,transparent_42%)]" />
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300">
              Session Entry
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Review the rules before your interview begins
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              This session opens in a focused coding environment. Read the
              guidelines below, then continue to launch the workspace in fullscreen.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Session Code
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {currentSession.sessionCode}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              What You Can Do
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="font-medium text-white">Use the provided sandbox</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Write, edit, and run your solution only inside the ProctoCode
                  coding environment.
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="font-medium text-white">Switch supported languages</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Change between the allowed runtimes when needed for the interview.
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="font-medium text-white">Leave after completion</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Once your work is done, you can leave the session and your session
                  record will remain available on the dashboard.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
              What Is Monitored
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                <p className="font-medium text-white">Window or tab switching</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Moving away from the interview view reduces trust score for the
                  current session.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                <p className="font-medium text-white">Large paste behavior</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Large pasted content is flagged because it can indicate outside
                  assistance.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                <p className="font-medium text-white">Extended inactivity</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Long idle periods are logged as part of the trust timeline for this
                  interview.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-5 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-6">
            Continuing will request fullscreen from your browser so the interview can
            begin in a focused environment.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleAcceptRules();
            }}
            disabled={isRequestingFullscreen}
            className="rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRequestingFullscreen
              ? "Starting Session..."
              : "Accept Rules & Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
