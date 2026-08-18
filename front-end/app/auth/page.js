import Link from "next/link";

export default function AuthPage() {
  return (
    <main className="auth-page px-4 text-white sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card auth-card-enter relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="auth-card-aside hidden min-h-[620px] flex-col justify-between p-10 lg:flex">
          <p className="font-bold text-5xl tracking-[-0.02em]">
            Tik<span className="text-[#ff5275]">Pong</span>
          </p>

          <div>
            <h1 className="mt-7 max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.055em]">
              Welcome to TikPong, a place to share and connect with others.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/58">
              Follow the people you care about, find communities that feel like home, and share at your own pace.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/40">
            <p>© 2024 TikPong Reboot01 Project</p>
          </div>
        </aside>

        <div className="flex min-h-[620px] items-center bg-[#0d0d10]/92 p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <p className="mb-12 text-sm font-bold tracking-[-0.02em] lg:hidden">
              Tik<span className="text-[#ff5275]">Pong</span>
            </p>

            <p className="text-3xl font-semibold text-[#ff6b89]">Welcome</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">How would you like to continue?</h2>
            <p className="mt-4 text-sm leading-6 text-white/48">
              
            </p>

            <div className="mt-9 space-y-3">
              <Link href="/auth/login" className="auth-primary-button">
                Sign in
              </Link>
              <Link href="/auth/register" className="auth-secondary-button">
                Create account
              </Link>
              <Link href="/posts" className="auth-guest-link">
                Continue as guest
              </Link>
            </div>

            <p className="mt-10 text-center text-xs leading-5 text-white/28">
              Explore public posts without an account. You can join whenever you are ready.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
