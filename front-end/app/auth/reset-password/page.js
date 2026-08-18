"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function passwordError(password) {
  if (!password) return "Enter a new password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  return "";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm() {
    const errors = {};
    const newPasswordError = passwordError(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "The passwords do not match.";
    }
    setFieldErrors(errors);
    const firstField = Object.keys(errors)[0];
    if (firstField) requestAnimationFrame(() => document.getElementById(firstField)?.focus());
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("This reset link is missing its token. Request a new link.");
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error || "We could not reset your password. Request a new link and try again.");
        return;
      }

      setSuccessMessage(payload?.message || "Password updated. Taking you to sign in...");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => router.replace("/auth/login"), 1200);
    } catch {
      setErrorMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `auth-input pr-14 ${fieldErrors[field] ? "auth-input-invalid" : ""}`;

  return (
    <main className="auth-page px-4 text-white sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card auth-card-enter relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="auth-card-aside hidden min-h-[620px] flex-col justify-between p-10 lg:flex">
          <Link href="/auth" className="text-4xl font-bold tracking-[-0.02em]">
            Tik<span className="text-[#ff8da4]">Pong</span>
          </Link>
          <div>
            <h1 className="mt-7 max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-0.04em]">
              A fresh password. A safer account.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Choose something unique that you do not use on another service.
            </p>
          </div>
          <p className="text-xs text-white/35">Your security stays in your hands.</p>
        </aside>

        <div className="flex min-h-[620px] items-center bg-[#0d0d10]/92 p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <p className="mb-9 text-sm font-bold lg:hidden">Tik<span className="text-[#ff5275]">Pong</span></p>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff6b89]">Almost there</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Reset password</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Remembered it? <Link href="/auth/login" className="font-semibold text-white transition hover:text-[#ff5275] underline">Back to sign in</Link>
            </p>

            {!token ? (
              <div className="mt-8 space-y-4">
                <div className="auth-alert auth-alert-error" role="alert">
                  This reset link is incomplete or invalid. Request a fresh link from the forgot-password page.
                </div>
                <Link href="/auth/forgot-password" className="auth-primary-button">Request a new link</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                <div>
                  <label htmlFor="newPassword" className="auth-label">New password</label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setFieldErrors((current) => ({ ...current, newPassword: "" }));
                      }}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      aria-invalid={Boolean(fieldErrors.newPassword)}
                      aria-describedby={fieldErrors.newPassword ? "newPassword-error" : "newPassword-hint"}
                      className={inputClass("newPassword")}
                    />
                    <button type="button" onClick={() => setShowPasswords((value) => !value)} className="auth-password-toggle" aria-label={showPasswords ? "Hide passwords" : "Show passwords"}>
                      <FontAwesomeIcon icon={showPasswords ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {fieldErrors.newPassword ? <p id="newPassword-error" className="auth-field-error" role="alert"><span>!</span>{fieldErrors.newPassword}</p> : <p id="newPassword-hint" className="auth-field-hint">8+ characters with uppercase, lowercase, and a number</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
                      }}
                      autoComplete="new-password"
                      placeholder="Enter it once more"
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                      className={inputClass("confirmPassword")}
                    />
                    <button type="button" onClick={() => setShowPasswords((value) => !value)} className="auth-password-toggle" aria-label={showPasswords ? "Hide passwords" : "Show passwords"}>
                      <FontAwesomeIcon icon={showPasswords ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {fieldErrors.confirmPassword ? <p id="confirmPassword-error" className="auth-field-error" role="alert"><span>!</span>{fieldErrors.confirmPassword}</p> : null}
                </div>

                {errorMessage ? <div className="auth-alert auth-alert-error" role="alert">{errorMessage}</div> : null}
                {successMessage ? <div className="auth-alert auth-alert-success" role="status">{successMessage}</div> : null}

                <button type="submit" disabled={isSubmitting} className="auth-primary-button">
                  {isSubmitting ? <><span className="auth-button-spinner" />Updating password...</> : <>Update password <span aria-hidden="true">→</span></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
