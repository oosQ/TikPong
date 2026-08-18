"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

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

function focusField(id) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nicknameOrEmail, setNicknameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error") || "";
    if (oauthError) {
      setErrorMessage(oauthError);
      setSuccessMessage("");
    }
  }, [searchParams]);

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setErrorMessage("");
  }

  function validateForm() {
    const errors = {};
    if (!nicknameOrEmail.trim()) {
      errors.nicknameOrEmail = "Make sure to enter your nickname or email address.";
    }
    if (!password.trim()) {
      errors.password = "Make sure to enter your password.";
    }

    setFieldErrors(errors);
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) focusField(firstInvalidField);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname_or_email: nicknameOrEmail.trim(),
          password,
        }),
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        const message = payload?.error || "Login failed. Please try again.";

        if (/already authenticated/i.test(message)) {
          router.replace("/posts");
          router.refresh();
          return;
        }

        if (/invalid credentials/i.test(message)) {
          setFieldErrors({
            nicknameOrEmail: "Invalid nickname or email address.",
            password: "Check your password.",
          });
          focusField("nicknameOrEmail");
        } else if (/nickname|email/i.test(message)) {
          setFieldErrors({ nicknameOrEmail: message });
          focusField("nicknameOrEmail");
        } else if (/password/i.test(message)) {
          setFieldErrors({ password: message });
          focusField("password");
        } else {
          setErrorMessage(message);
        }
        return;
      }

      setSuccessMessage(payload?.message || "Welcome back!");
      setNicknameOrEmail("");
      setPassword("");
      router.replace("/posts");
    } catch {
      setErrorMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `auth-input ${fieldErrors[field] ? "auth-input-invalid" : ""}`;

  return (
    <main className="auth-page px-4 text-white sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card auth-card-enter relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="auth-card-aside hidden min-h-[650px] flex-col justify-between p-10 lg:flex">
          <Link href="/auth" className="text-5xl font-bold tracking-[-0.02em] text-white">
            Tik<span className="text-[#ff5275]">Pong</span>
          </Link>

          <div>
            <div className="mb-8 flex -space-x-3" aria-hidden="true">
              {["Ali", "Mohd", "Nooh"].map((letter, index) => (
                <span key={letter} className={`auth-avatar auth-avatar-${index + 1}`}>
                  {letter}
                </span>
              ))}

            </div>
            <p className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-0.04em]">
              Your Friends are already here.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Pick up conversations, discover new communities, and share what matters to you.
            </p>
          </div>

          <p className="text-xs text-white/35"></p>
        </aside>

        <div className="flex min-h-[650px] items-center bg-[#0d0d10]/92 p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/auth" className="text-2xl font-bold tracking-[-0.02em]">
                Tik<span className="text-[#ff5275]">Pong</span>
              </Link>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Sign in</h1>
            <p className="mt-3 text-sm leading-6 text-white/50">
              New to TikPong?{" "}
              <Link href="/auth/register" className="font-semibold text-white transition hover:text-[#ff5275] underline">
                Create an account
              </Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
              <div>
                <label htmlFor="nicknameOrEmail" className="auth-label">Nickname or email</label>
                <div className="relative">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="m5 7 7 5 7-5"/></svg>
                  </span>
                  <input
                    id="nicknameOrEmail"
                    type="text"
                    value={nicknameOrEmail}
                    onChange={(event) => {
                      setNicknameOrEmail(event.target.value);
                      clearFieldError("nicknameOrEmail");
                    }}
                    autoComplete="username"
                    placeholder="email@reboot01.dev"
                    aria-invalid={Boolean(fieldErrors.nicknameOrEmail)}
                    aria-describedby={fieldErrors.nicknameOrEmail ? "nicknameOrEmail-error" : undefined}
                    className={`${inputClass("nicknameOrEmail")} auth-input-with-icon`}
                  />
                </div>
                {fieldErrors.nicknameOrEmail ? (
                  <p id="nicknameOrEmail-error" className="auth-field-error" role="alert">
                    <span aria-hidden="true">!</span>{fieldErrors.nicknameOrEmail}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="auth-label !mb-0">Password</label>
                </div>
                <div className="relative">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError("password");
                    }}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    className={`${inputClass("password")} auth-input-with-icon pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="auth-password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p id="password-error" className="auth-field-error" role="alert">
                    <span aria-hidden="true">!</span>{fieldErrors.password}
                  </p>
                ) : null}
                <Link href="/auth/forgot-password" className="text-sm font-semibold text-white/55 transition hover:text-[#ff5275] flex justify-end mt-4">
                    Forgot password?
                  </Link>
              </div>

              {errorMessage ? <div className="auth-alert auth-alert-error" role="alert">{errorMessage}</div> : null}
              {successMessage ? <div className="auth-alert auth-alert-success" role="status">{successMessage}</div> : null}

              <button type="submit" disabled={isSubmitting} className="auth-primary-button ">
                {isSubmitting ? <><span className="auth-button-spinner" />Signing in...</> : <>Sign in</> }
              </button>

            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
