"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faImage } from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nickname: "",
  aboutMe: "",
  isPublic: false,
  avatar: null,
};

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

function getFieldFromServerError(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("password")) return "password";
  if (normalized.includes("first_name") || normalized.includes("first name")) return "firstName";
  if (normalized.includes("last_name") || normalized.includes("last name")) return "lastName";
  if (normalized.includes("date_of_birth") || normalized.includes("date of birth")) return "dateOfBirth";
  if (normalized.includes("nickname")) return "nickname";
  if (normalized.includes("about_me") || normalized.includes("about me")) return "aboutMe";
  if (normalized.includes("avatar") || normalized.includes("image")) return "avatar";
  return "";
}

function makeServerErrorReadable(field, message) {
  if (field === "email" && /already exists/i.test(message)) {
    return "An account with this email already exists.";
  }
  if (field === "nickname" && /already exists/i.test(message)) {
    return "This nickname is already taken.";
  }

  const readable = message.replaceAll("_", " ");
  return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function openDatePicker(event) {
    event.currentTarget.showPicker?.();
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setErrorMessage("");
  }

  function validateForm() {
    const errors = {};
    const email = form.email.trim();

    if (!email) {
      errors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email, such as name@example.com.";
    }

    if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
    if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
    if (!form.dateOfBirth) errors.dateOfBirth = "Choose your date of birth.";

    if (!form.password) {
      errors.password = "Create a password.";
    } else if (form.password.length < 8) {
      errors.password = "Use at least 8 characters.";
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = "Add at least one uppercase letter.";
    } else if (!/[a-z]/.test(form.password)) {
      errors.password = "Add at least one lowercase letter.";
    } else if (!/[0-9]/.test(form.password)) {
      errors.password = "Add at least one number.";
    }

    if (form.nickname.length > 30) errors.nickname = "Keep your nickname under 30 characters.";
    if (form.aboutMe.length > 500) errors.aboutMe = "Keep your bio under 500 characters.";

    setFieldErrors(errors);
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) focusField(firstInvalidField);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("email", form.email.trim());
    formData.append("password", form.password);
    formData.append("first_name", form.firstName.trim());
    formData.append("last_name", form.lastName.trim());
    formData.append("date_of_birth", form.dateOfBirth);
    if (form.nickname.trim()) formData.append("nickname", form.nickname.trim());
    if (form.aboutMe.trim()) formData.append("about_me", form.aboutMe.trim());
    formData.append("is_public", String(form.isPublic));
    if (form.avatar) formData.append("avatar_path", form.avatar);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: formData,
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        const message = payload?.error || "Registration failed. Please try again.";
        if (/already authenticated/i.test(message)) {
          router.replace("/posts");
          router.refresh();
          return;
        }
        const field = getFieldFromServerError(message);
        if (field) {
          setFieldErrors((current) => ({
            ...current,
            [field]: makeServerErrorReadable(field, message),
          }));
          focusField(field);
        } else {
          setErrorMessage(message);
        }
        return;
      }

      setSuccessMessage(payload?.message || "Your account is ready!");
      setForm(initialForm);
      formElement.reset();
      router.replace("/auth/login");
    } catch {
      setErrorMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `auth-input ${fieldErrors[field] ? "auth-input-invalid" : ""}`;
  const errorFor = (field) =>
    fieldErrors[field] ? (
      <p id={`${field}-error`} className="auth-field-error" role="alert">
        <span aria-hidden="true">!</span>{fieldErrors[field]}
      </p>
    ) : null;

  return (
    <main className="auth-page px-4 text-white sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card auth-card-enter relative z-10 grid w-full max-w-6xl overflow-hidden lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="auth-card-aside hidden flex-col justify-between p-10 lg:flex">
          <Link href="/auth" className="text-5xl font-bold tracking-[-0.02em] text-white">
            Tik<span className="text-[#ff5275]">Pong</span>
          </Link>

          <div className="sticky top-10">
            <h2 className="mt-7 max-w-xs text-6xl font-semibold leading-[1.12] tracking-[-0.04em]">
              A profile that feels like you.
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">
              Join Groups, follow friends, and choose how much of your world you want to share.
            </p>

          </div>

          <p className="text-xs text-white/35"></p>
        </aside>

        <div className="bg-[#0d0d10]/92 p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8 lg:hidden">
              <Link href="/auth" className="text-4xl font-bold tracking-[-0.02em]">
                Tik<span className="text-[#ff5275]">Pong</span>
              </Link>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Create new account</h1>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Already a member?{" "}
              <Link href="/auth/login" className="font-semibold text-white transition hover:text-[#ff5275] underline">
                Sign in
              </Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-9 grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="auth-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  autoComplete="email"
                  placeholder="email@reboot01.dev"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={inputClass("email")}
                />
                {errorFor("email")}
              </div>

              <div>
                <label htmlFor="firstName" className="auth-label">First name</label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  autoComplete="given-name"
                  placeholder="Tik"
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                  className={inputClass("firstName")}
                />
                {errorFor("firstName")}
              </div>

              <div>
                <label htmlFor="lastName" className="auth-label">Last name</label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  autoComplete="family-name"
                  placeholder="Pong"
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                  className={inputClass("lastName")}
                />
                {errorFor("lastName")}
              </div>

              <div>
                <label htmlFor="nickname" className="auth-label">
                  Nickname
                </label>
                <input
                  id="nickname"
                  value={form.nickname}
                  onChange={(event) => updateField("nickname", event.target.value)}
                  autoComplete="nickname"
                  placeholder="tikpong"
                  maxLength={31}
                  aria-invalid={Boolean(fieldErrors.nickname)}
                  aria-describedby={fieldErrors.nickname ? "nickname-error" : "nickname-hint"}
                  className={inputClass("nickname")}
                />
                {errorFor("nickname")}
                {!fieldErrors.nickname ? <p id="nickname-hint" className="auth-field-hint">Up to 30 characters</p> : null}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="auth-label">Date of birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  onClick={openDatePicker}
                  autoComplete="bday"
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                  aria-describedby={fieldErrors.dateOfBirth ? "dateOfBirth-error" : undefined}
                  className={`${inputClass("dateOfBirth")} auth-date-input`}
                />
                {errorFor("dateOfBirth")}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="auth-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                    className={`${inputClass("password")} pr-14`}
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
                {errorFor("password")}
                {!fieldErrors.password ? <p id="password-hint" className="auth-field-hint">8+ characters with uppercase, lowercase, and a number</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="aboutMe" className="auth-label">
                  About you
                </label>
                <textarea
                  id="aboutMe"
                  value={form.aboutMe}
                  onChange={(event) => updateField("aboutMe", event.target.value)}
                  rows={3}
                  maxLength={501}
                  placeholder="A short intro, your interests, or what you are working on..."
                  aria-invalid={Boolean(fieldErrors.aboutMe)}
                  aria-describedby={fieldErrors.aboutMe ? "aboutMe-error" : "aboutMe-count"}
                  className={`${inputClass("aboutMe")} min-h-24 resize-none`}
                />
                {errorFor("aboutMe")}
                <p id="aboutMe-count" className={`mt-2 text-right text-xs ${form.aboutMe.length > 500 ? "text-red-300" : "text-white/30"}`}>
                  {form.aboutMe.length}/500
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="avatar" className="auth-label">
                  Profile photo
                </label>
                <label className={`auth-file-input ${fieldErrors.avatar ? "auth-input-invalid" : ""}`}>
                  <span className="auth-file-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={faImage} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-medium text-white">
                      {form.avatar?.name || "Upload Your Avatar"}
                    </strong>
                    <span className="mt-1 block text-xs text-white/35">PNG, JPG, or GIF</span>
                  </span>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (file && !["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
                        setFieldErrors((current) => ({ ...current, avatar: "Choose a PNG, JPG, or GIF image." }));
                        event.target.value = "";
                        return;
                      }
                      updateField("avatar", file);
                    }}
                    aria-invalid={Boolean(fieldErrors.avatar)}
                    aria-describedby={fieldErrors.avatar ? "avatar-error" : undefined}
                    className="sr-only"
                  />
                </label>
                {errorFor("avatar")}
              </div>

              <label className="auth-privacy-card sm:col-span-2">
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-medium text-white">Public profile</strong>
                  <span className="mt-1 block text-xs leading-5 text-white/40">
                    Anyone can view your posts. Turn this off to approve followers first.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(event) => updateField("isPublic", event.target.checked)}
                  className="peer sr-only"
                />
                <span className="auth-switch" aria-hidden="true"><span /></span>
              </label>

              {errorMessage ? <div className="auth-alert auth-alert-error sm:col-span-2" role="alert">{errorMessage}</div> : null}
              {successMessage ? <div className="auth-alert auth-alert-success sm:col-span-2" role="status">{successMessage}</div> : null}

              <button type="submit" disabled={isSubmitting} className="auth-primary-button sm:col-span-2">
                {isSubmitting ? <><span className="auth-button-spinner" />Creating your account...</> : <>Create account </>}
              </button>

            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
