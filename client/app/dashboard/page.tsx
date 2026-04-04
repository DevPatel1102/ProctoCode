import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { CandidateWorkspace } from "@/components/candidate-workspace";
import { SESSION_ID_COOKIE_NAME } from "@/lib/session";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasActiveSession = cookieStore.get(SESSION_ID_COOKIE_NAME);

  if (hasActiveSession) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <CandidateWorkspace />
      </main>
    );
  }

  return (
    <AppShell
      currentPath="/dashboard"
      role="student"
      eyebrow="Student Dashboard"
      title="Review your sessions and return to the next interview with confidence"
      description="Track your joined sessions, revisit trust-score outcomes, and step back into the coding environment without losing the product feel of a real interview platform."
    >
      <CandidateWorkspace />
    </AppShell>
  );
}
