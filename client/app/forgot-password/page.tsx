import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="panel-surface hidden rounded-[2rem] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">
              Account Recovery
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight text-white">
              Recover access without breaking the secure interview flow.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              ProctoCode uses a one-time verification code so password reset stays
              deliberate and tied to the account email.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Short-lived OTP</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Reset codes expire quickly to reduce misuse and replay attempts.
              </p>
            </div>
            <div className="panel-muted p-5">
              <p className="text-sm font-medium text-white">Fresh password</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Once the OTP is valid, your old password is replaced with a newly
                hashed one.
              </p>
            </div>
          </div>
        </section>

        <div className="flex">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
