import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col justify-center space-y-6 lg:order-2">
          <AuthForm mode="signup" />
          <p className="text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link className="text-cyan-300 hover:text-cyan-200" href="/login">
              Login
            </Link>
          </p>
        </div>

        <section className="panel-surface hidden rounded-[2rem] p-8 lg:flex lg:flex-col lg:justify-between lg:order-1">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
              Create Your Role
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight text-white">
              Start as a student or spin up isolated sessions as an admin.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Every account enters the same Ghost-Proof platform, but the experience
              stays role-specific so session ownership, monitoring, and trust scoring are
              kept clean.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Student accounts</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Join by session code and keep a visible history of the sessions you
                participated in.
              </p>
            </div>
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Admin accounts</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Create, deactivate, and delete only the sessions you own, without
                mixing in another admin&apos;s rooms.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
