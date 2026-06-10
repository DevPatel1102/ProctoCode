import { cookies } from "next/headers";
import Link from "next/link";

import { AdminUserMonitor } from "@/components/admin-user-monitor";
import { AiBehaviorAnalysis } from "@/components/ai-behavior-analysis";
import { AiCodeReview } from "@/components/ai-code-review";
import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import { type LiveBehaviorEvent } from "@/lib/monitor";

type PageProps = {
  params: Promise<{
    sessionId: string;
    userId: string;
  }>;
};

type SessionSummary = {
  id: string;
  sessionName: string;
  sessionCode: string;
  isActive: boolean;
  createdAt: string;
};

type SessionUser = {
  id: string;
  userId: string;
  email: string;
  trustScore: number;
  lastActivity: string;
  leftAt: string | null;
};

type AiCodeReviewData = {
  qualityScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  readability: string;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
  reviewedAt: string;
} | null;

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function getSessions(token: string) {
  const response = await fetch(`${getBackendUrl()}/api/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { sessions: SessionSummary[] };
  return data.sessions;
}

async function getSessionUsers(token: string, sessionId: string) {
  const response = await fetch(`${getBackendUrl()}/api/sessions/${sessionId}/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { users: SessionUser[] };
  return data.users;
}

async function getUserEvents(token: string, sessionId: string, userId: string) {
  const url = new URL(`${getBackendUrl()}/api/monitor/events`);
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("userId", userId);

  const response = await fetch(url.toString(), {
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

async function getAiCodeReview(token: string, sessionId: string, userId: string) {
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/ai/code-review?sessionId=${sessionId}&userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return { review: null, hasSubmittedCode: false };
    }

    const data = (await response.json()) as {
      review: AiCodeReviewData;
      hasSubmittedCode: boolean;
    };

    return {
      review: data.review ?? null,
      hasSubmittedCode: data.hasSubmittedCode ?? false
    };
  } catch {
    return { review: null, hasSubmittedCode: false };
  }
}

export default async function AdminUserMonitorPage({ params }: PageProps) {
  const token = await getToken();
  const { sessionId, userId } = await params;

  if (!token) {
    return null;
  }

  const [sessions, users, events, aiReview] = await Promise.all([
    getSessions(token),
    getSessionUsers(token, sessionId),
    getUserEvents(token, sessionId, userId),
    getAiCodeReview(token, sessionId, userId)
  ]);

  const session = sessions.find((item) => item.id === sessionId) ?? null;
  const user = users.find((item) => item.userId === userId) ?? null;

  if (!session || !user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-rose-100">
          Monitor target not found.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
            Admin Monitor
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{session.sessionName}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Live monitoring for one candidate inside session {session.sessionCode}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-teal-300 hover:text-teal-200"
            href="/admin"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <AdminUserMonitor
          sessionId={sessionId}
          userId={userId}
          sessionCode={session.sessionCode}
          userEmail={user.email}
          initialEvents={events}
          token={token}
        />

        <AiBehaviorAnalysis
          sessionId={sessionId}
          userId={userId}
          userEmail={user.email}
          eventCount={events.length}
        />

        <AiCodeReview
          sessionId={sessionId}
          userId={userId}
          userEmail={user.email}
          initialReview={aiReview.review}
          hasSubmittedCode={aiReview.hasSubmittedCode}
        />
      </div>
    </main>
  );
}
