import { cookies } from "next/headers";
import Link from "next/link";

import { AUTH_COOKIE_NAME } from "@/lib/auth";

const highlights = [
  {
    title: "Live trust scoring",
    description: "Every session starts fresh, tracks suspicious behavior, and updates trust in real time."
  },
  {
    title: "Isolated interview rooms",
    description: "Admins create named sessions with codes, while candidates enter a focused rules-first workspace."
  },
  {
    title: "Reviewable audit trail",
    description: "Behavior logs, timelines, and session history remain preserved for monitoring and post-interview review."
  }
];

const workflow = [
  "Create a session and share the code",
  "Candidate joins, accepts rules, and enters fullscreen",
  "Logs, trust score, and timelines stay attached to that single session"
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="home-glass flex items-center justify-between rounded-[2rem] px-5 py-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
            Ghost-Proof
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Proctoring and interview sandbox for real coding sessions
          </p>
        </div>

        <nav className="hidden items-center gap-3 sm:flex">
          {hasToken ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                Go to Workspace
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Start Now
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="home-hero relative mt-6 overflow-hidden rounded-[2.4rem] px-6 py-10 shadow-2xl shadow-slate-950/30 sm:px-8 sm:py-14 lg:px-12">
        <div className="home-hero-glow absolute right-0 top-0 hidden h-full w-1/2 lg:block" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-emerald-400">
              Built For Interview Integrity
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              The coding interview room that helps teams spot signals, not guess.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Ghost-Proof gives admins isolated session control, candidates a focused
              coding environment, and evaluators a structured trail of trust score,
              timeline events, and session history.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {hasToken ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Logout
                  </button>
                </form>
              ) : (
                <Link
                  href="/signup"
                  className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Create Account
                </Link>
              )}
              <a
                href="#features"
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="panel-muted p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Sessions
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">Fresh</p>
                <p className="mt-1 text-sm text-slate-300">Every interview begins with a clean trust score.</p>
              </div>
              <div className="panel-muted p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Monitoring
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">Live</p>
                <p className="mt-1 text-sm text-slate-300">Logs and timeline feed the admin view in real time.</p>
              </div>
              <div className="panel-muted p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Recovery
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">OTP</p>
                <p className="mt-1 text-sm text-slate-300">Password resets now run through real email delivery.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="panel-surface rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                    Session Snapshot
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    One platform, two role-specific paths
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100">
                  Product View
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="home-card rounded-[1.4rem] border border-white/10 px-4 py-4"
                  >
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-surface rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                Interview Flow
              </p>
              <div className="mt-5 space-y-3">
                {workflow.map((item, index) => (
                  <div
                    key={item}
                    className="home-card flex gap-4 rounded-[1.4rem] border border-white/10 px-4 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-sm font-semibold text-slate-950">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel-surface rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            For Students
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Join fast, code clearly, and keep session history visible
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Candidates enter with a session code, review rules, move into fullscreen,
            and later review their past trust score outcomes from the dashboard.
          </p>
        </div>

        <div className="panel-surface rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            For Admins
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Create isolated rooms and keep ownership per admin
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Each admin controls only the sessions they created, with candidate trust
            status, logs, and timelines grouped cleanly by session.
          </p>
        </div>

        <div className="panel-surface rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            For Teams
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Replace guesswork with structured evidence
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Instead of binary accusations, Ghost-Proof builds a timeline of signals so
            evaluators can review behavior with context.
          </p>
        </div>
      </section>
    </main>
  );
}
