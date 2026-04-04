"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/providers/session-provider";

export function JoinSessionForm() {
  const router = useRouter();
  const { setCurrentSession } = useSession();
  const [sessionCode, setSessionCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/sessions/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionCode })
      });

      const data = (await response.json()) as {
        message?: string;
        sessionId?: string;
        sessionCode?: string;
      };

      if (!response.ok || !data.sessionId || !data.sessionCode) {
        setMessage(data.message ?? "Failed to join session");
        setIsSubmitting(false);
        return;
      }

      setCurrentSession({
        sessionId: data.sessionId,
        sessionCode: data.sessionCode
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the session service right now");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-surface w-full max-w-lg rounded-[2rem] p-8 sm:p-9">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Join Session
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Enter your session code
        </h1>
        <p className="max-w-md text-sm leading-7 text-slate-300">
          Each coding interview runs in an isolated room with its own trust score,
          logs, and evaluator timeline.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm text-slate-200">Session Code</span>
          <input
            required
            value={sessionCode}
            onChange={(event) => setSessionCode(event.target.value.toUpperCase())}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-base tracking-[0.24em] text-white uppercase outline-none transition focus:border-cyan-400"
            placeholder="ABC123"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            Fresh trust score
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            Rules before start
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            Fullscreen entry
          </div>
        </div>

        {message ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Joining..." : "Join Session"}
        </button>
      </form>
    </div>
  );
}
