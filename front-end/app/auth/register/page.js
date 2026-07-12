"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function openDatePicker(event) {
    event.currentTarget.showPicker?.();
  }

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("first_name", form.firstName);
    formData.append("last_name", form.lastName);
    formData.append("date_of_birth", form.dateOfBirth);

    if (form.nickname) {
      formData.append("nickname", form.nickname);
    }
    if (form.aboutMe) {
      formData.append("about_me", form.aboutMe);
    }
    formData.append("is_public", String(form.isPublic));
    if (form.avatar) {
      formData.append("avatar_path", form.avatar);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: formData,
      });

      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error || "Registration failed");
        return;
      }

      setSuccessMessage(payload?.message || "User registered successfully");
      setForm(initialForm);
      event.target.reset();
      router.replace("/auth/login");
    } catch {
      setErrorMessage("Could not connect to the backend server");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/40">
            Social Network
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Register
          </h1>
          <p className="mt-4 text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-white transition hover:text-[#fe2c55]">
              Login
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">

          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/72">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
              required
            />
          </div>

          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-white/72">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-white/72">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
              required
            />
          </div>

          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-white/72">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={form.nickname}
              onChange={(event) => updateField("nickname", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="mb-2 block text-sm font-medium text-white/72">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => updateField("dateOfBirth", event.target.value)}
              onClick={openDatePicker}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/72">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="aboutMe" className="mb-2 block text-sm font-medium text-white/72">
              About me
            </label>
            <textarea
              id="aboutMe"
              value={form.aboutMe}
              onChange={(event) => updateField("aboutMe", event.target.value)}
              rows={4}
              maxLength={500}
              className="max-h-40 w-full resize-none overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
            <p className="mt-2 text-right text-xs text-white/40">
              {form.aboutMe.length}/500
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="avatar" className="mb-2 block text-sm font-medium text-white/72">
              Avatar
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/png,image/jpeg,image/gif"
              onChange={(event) => updateField("avatar", event.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[#fe2c55] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(event) => updateField("isPublic", event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            Public profile
          </label>

          {errorMessage ? (
            <div className="sm:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="sm:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 w-full rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>

          <div className="sm:col-span-2 flex items-center gap-4 pt-2 text-xs uppercase tracking-[0.22em] text-white/28">
            <span className="h-px flex-1 bg-white/10" />
            <span>Or continue with Google</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="sm:col-span-2">
            <a
              href={`${API_BASE_URL}/api/auth/google/login`}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <span className="text-base leading-none">G</span>
              <span>Continue with Google</span>
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}