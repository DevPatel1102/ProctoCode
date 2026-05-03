import { cookies } from "next/headers";
import Link from "next/link";

import { EvaluatorDashboard } from "@/components/evaluator-dashboard";
import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import { type LiveBehaviorEvent, type MonitorUser } from "@/lib/monitor";

async function getUsers() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return [];
  }

  const response = await fetch(`${getBackendUrl()}/api/monitor/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { users: MonitorUser[] };
  return data.users;
}

async function getEvents() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return [];
  }

  const response = await fetch(`${getBackendUrl()}/api/monitor/events`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { events: LiveBehaviorEvent[] };
  return data.events;
}

async function getSessionIds() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return [];
  }

  const response = await fetch(`${getBackendUrl()}/api/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    sessions: Array<{ id: string }>;
  };
  return data.sessions.map((session) => session.id);
}

export default async function EvaluatorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const [users, events, sessionIds] = await Promise.all([
    getUsers(),
    getEvents(),
    getSessionIds()
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
            Evaluator Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Live Monitoring</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            This page shows a simple real-time stream of behavior events and the users
            currently known to the system.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-teal-300 hover:text-teal-200"
            href="/dashboard"
          >
            Candidate View
          </Link>
          <Link
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-teal-300 hover:text-teal-200"
            href="/"
          >
            Home
          </Link>
        </div>
      </div>

      <EvaluatorDashboard
        initialUsers={users}
        initialEvents={events}
        sessionIds={sessionIds}
        token={token ?? ""}
      />
    </main>
  );
}

