"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ForgotPasswordStep = "request" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.message ?? "Unable to request OTP");
        setIsSubmitting(false);
        return;
      }

      setMessage(data.message ?? "OTP sent");
      setStep("reset");
    } catch {
      setErrorMessage("Unable to connect to the password reset service");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.message ?? "Unable to reset password");
        setIsSubmitting(false);
        return;
      }

      setMessage(data.message ?? "Password reset successful");
      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage("Unable to complete password reset right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-surface w-full max-w-xl rounded-[2rem] p-8 sm:p-9">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Password Recovery
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Reset your password with OTP
        </h1>
        <p className="max-w-lg text-sm leading-7 text-slate-300">
          Enter your account email, request a one-time code, then choose a new
          password to regain access.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-2xl border px-4 py-3 ${
            step === "request"
              ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
              : "border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          <p className="text-sm font-medium">1. Request OTP</p>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 ${
            step === "reset"
              ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
              : "border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          <p className="text-sm font-medium">2. Reset Password</p>
        </div>
      </div>

      {step === "request" ? (
        <form className="mt-8 space-y-5" onSubmit={handleRequestOtp}>
          <label className="block space-y-2">
            <span className="text-sm text-slate-200">Account Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Requesting..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
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
            <span className="text-sm text-slate-200">OTP</span>
            <input
              required
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 tracking-[0.3em] text-white outline-none transition focus:border-cyan-400"
              placeholder="123456"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-200">New Password</span>
            <input
              required
              minLength={6}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="Minimum 6 characters"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setErrorMessage("");
                setMessage("");
              }}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:text-cyan-100"
            >
              Request New OTP
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-slate-300">
        <Link className="text-cyan-300 hover:text-cyan-200" href="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
