import Link from "next/link";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/40">
            Social Network
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Welcome
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Join the network, sign in to your account, or continue as a guest to explore public content.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="flex w-full items-center justify-center rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
          >
            Login
          </Link>

          <Link
            href="/auth/register"
            className="flex w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Register
          </Link>

          <Link
            href="/posts"
            className="flex w-full items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  );
}