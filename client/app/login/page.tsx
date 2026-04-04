import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="panel-surface hidden rounded-[2rem] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
              Ghost-Proof Access
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight text-white">
              Production-style interview access for admins and students.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Sign in to continue a coding session, review session history, or manage
              isolated interview rooms from the admin console.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Student flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Join with a session code, accept rules, and work inside the monitored
                coding environment.
              </p>
            </div>
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Admin flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Create sessions, supervise trust score changes, and preserve session
                history per admin.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col justify-center space-y-6">
          <AuthForm mode="login" />
          <p className="text-center text-sm text-slate-300">
            Forgot your password?{" "}
            <Link className="text-cyan-300 hover:text-cyan-200" href="/forgot-password">
              Reset it with OTP
            </Link>
          </p>
          <p className="text-center text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <Link className="text-cyan-300 hover:text-cyan-200" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
