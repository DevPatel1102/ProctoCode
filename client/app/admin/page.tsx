import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <AppShell
      currentPath="/admin"
      role="admin"
      eyebrow="Admin Dashboard"
      title="Create, observe, and preserve interview sessions with clear control"
      description="Each admin works inside their own isolated session set. Create interview rooms, monitor joined candidates, and manage historical session data from one clean command surface."
    >
      <AdminDashboard />
    </AppShell>
  );
}
