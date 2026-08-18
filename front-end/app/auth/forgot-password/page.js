"use client";

import Link from "next/link";
import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setEmailError("Enter the email address for your account.");
      document.getElementById("email")?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email, such as name@example.com.");
      document.getElementById("email")?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        const message = payload?.error || "We could not send a reset email.";
        if (/email/i.test(message)) setEmailError(message);
        else setErrorMessage(message);
        return;
      }

      setSuccessMessage(payload?.message || "Check your inbox for a password reset link.");
      setEmail("");
    } catch {
      setErrorMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page px-4 text-white sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <section className="auth-card auth-card-enter relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="auth-card-aside hidden min-h-[600px] flex-col justify-between p-10 lg:flex">
          <Link href="/auth" className="text-5xl font-bold tracking-[-0.02em]">Tik<span className="text-[#ff8da4]">Pong</span></Link>
          <div>
            <h1 className="mt-7 max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-0.04em]">Let&apos;s get you back in.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">We will send a secure reset link to the email connected to your account.</p>
          </div>
          <p className="text-xs text-white/35"></p>
        </aside>

        <div className="flex min-h-[500px] items-center bg-[#0d0d10]/92 p-6 sm:p-5 lg:p-14">
          <div className=" w-full max-w-md">
            <p className="mb-9 text-4xl font-bold lg:hidden">Tik<span className="text-[#ff5275]">Pong</span></p>
            <p className="text-xl font-semibold text-[#ff6b89]">Need help?</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Forgot password</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Remembered it? <Link href="/auth/login" className="font-semibold text-white transition hover:text-[#ff5275] underline">Back to sign in</Link></p>

            <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
              <div>
                <label htmlFor="email" className="auth-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError("");
                    setErrorMessage("");
                  }}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`auth-input ${emailError ? "auth-input-invalid" : ""}`}
                />
                {emailError ? <p id="email-error" className="auth-field-error" role="alert"><span>!</span>{emailError}</p> : null}
              </div>

              {errorMessage ? <div className="auth-alert auth-alert-error" role="alert">{errorMessage}</div> : null}
              {successMessage ? <div className="auth-alert auth-alert-success" role="status">{successMessage}</div> : null}

              <button type="submit" disabled={isSubmitting} className="auth-primary-button">
                {isSubmitting ? <><span className="auth-button-spinner" />Sending link...</> : <>Send reset link</>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
