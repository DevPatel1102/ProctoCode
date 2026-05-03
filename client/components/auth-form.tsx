"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UserRole } from "@/lib/auth";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isLogin ? { email, password } : { email, password, role }
        )
      });

      const data = (await response.json()) as {
        message?: string;
        user?: {
          role?: "admin" | "candidate";
        };
      };

      if (!response.ok) {
        setMessage(data.message ?? "Authentication failed");
        setIsSubmitting(false);
        return;
      }

      router.push(data.user?.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the authentication service");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-surface h-full w-full rounded-[2rem] p-8 sm:p-9">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          ProctoCode Auth
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          {isLogin ? "Login" : "Create account"}
        </h1>
        <p className="max-w-lg text-sm leading-7 text-slate-300">
          {isLogin
            ? "Sign in to access your role-specific workspace."
            : "Choose whether this account is for a student or an admin."}
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm text-slate-200">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-slate-200">Password</span>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="Minimum 6 characters"
          />
        </label>

        {!isLogin ? (
          <div className="space-y-3">
            <span className="text-sm text-slate-200">Role</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  role === "candidate"
                    ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-slate-950 text-slate-200 hover:border-cyan-400/40"
                }`}
              >
                <p className="font-medium text-white">Student</p>
                <p className="mt-1 text-xs text-slate-300">
                  Join interview sessions with a code.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  role === "admin"
                    ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-slate-950 text-slate-200 hover:border-cyan-400/40"
                }`}
              >
                <p className="font-medium text-white">Admin</p>
                <p className="mt-1 text-xs text-slate-300">
                  Create and monitor isolated sessions.
                </p>
              </button>
            </div>
          </div>
        ) : null}

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
          {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
