import Link from "next/link";

type AppShellProps = {
  currentPath: string;
  role: "student" | "admin";
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const studentNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Your sessions and activity"
  },
  {
    href: "/join",
    label: "Join Session",
    description: "Enter a session code"
  }
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Session Control",
    description: "Create and manage interview rooms"
  }
];

function getNavItems(role: AppShellProps["role"]) {
  return role === "admin" ? adminNavItems : studentNavItems;
}

export function AppShell({
  currentPath,
  role,
  eyebrow,
  title,
  description,
  children
}: AppShellProps) {
  const navItems = getNavItems(role);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel-surface relative overflow-hidden rounded-[2rem] p-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
                  Ghost-Proof
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">
                  {role === "admin" ? "Admin Console" : "Student Workspace"}
                </h1>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-200">
                {role}
              </span>
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const isActive = currentPath === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl border px-4 py-4 transition ${
                      isActive
                        ? "border-cyan-300/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/10"
                        : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Session Rules
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Interview data stays isolated per session, and every action is tied to
                that timeline.
              </p>
            </div>

            <div className="mt-auto space-y-3 pt-8">
              <Link
                href="/"
                className="block rounded-2xl border border-white/8 px-4 py-3 text-center text-sm text-slate-300 transition hover:border-white/15 hover:text-white"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <header className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
              {eyebrow}
            </p>
            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-auto">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Navigation
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {role === "admin" ? "Admin-only controls" : "Student-only flow"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Experience
                  </p>
                  <p className="mt-2 text-sm text-white">Responsive and monitored</p>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-4">{children}</div>
        </section>
      </div>
    </main>
  );
}
