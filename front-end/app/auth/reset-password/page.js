"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setErrorMessage("Missing reset token");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error || "Failed to reset password");
        return;
      }

      setSuccessMessage(payload?.message || "Password reset successfully");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.replace("/auth/login");
      }, 1200);
    } catch {
      setErrorMessage("Could not connect to the backend server");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/40">
            Social Network
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Choose a new password for your account.
          </p>
          <p className="mt-4 text-sm text-white/50">
            Back to{" "}
            <Link href="/auth/login" className="font-semibold text-white transition hover:text-[#fe2c55]">
              login
            </Link>
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Missing reset token. Open the password reset link from your email again.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-white/72">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="New password"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-white/72">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                required
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}