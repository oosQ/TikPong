"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

const initialForm = {
  title: "",
  content: "",
  privacy: "public",
  hashtags: "",
  image: null,
};

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

function parseHashtags(input) {
  return input
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("#") && item.length > 1)
    .map((item) => item.replace(/^#+/, ""))
    .filter(Boolean);
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8 14 2.8-2.8a1 1 0 0 1 1.4 0L16 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.5" cy="9.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [followers, setFollowers] = useState([]);
  const [selectedViewers, setSelectedViewers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    async function checkAuth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const payload = await parseResponse(response);
        if (!ignore && (!response.ok || !payload?.success)) {
          router.replace("/auth/login");
          return;
        }
      } catch {
        if (!ignore) {
          router.replace("/auth/login");
          return;
        }
      } finally {
        if (!ignore) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      ignore = true;
    };
  }, [router]);

  // Fetch followers when the user picks "private"
  useEffect(() => {
    if (form.privacy !== "private") return;
    let ignore = false;
    setIsLoadingFollowers(true);

    async function loadFollowers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/followers?limit=100`, {
          credentials: "include",
        });
        const payload = await parseResponse(res);
        if (!ignore && res.ok && payload?.success) {
          setFollowers(payload.data?.users ?? []);
        }
      } catch {}
      finally {
        if (!ignore) setIsLoadingFollowers(false);
      }
    }

    loadFollowers();
    return () => { ignore = true; };
  }, [form.privacy]);

  function toggleViewer(userId) {
    setSelectedViewers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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
    formData.append("title", form.title);
    formData.append("content", form.content);
    formData.append("privacy", form.privacy);

    parseHashtags(form.hashtags).forEach((hashtag) => formData.append("hashtags", hashtag));

    if (form.privacy === "private") {
      selectedViewers.forEach((viewerId) => formData.append("allowed_viewers", viewerId));
    }

    if (form.image) {
      formData.append("image_path", form.image);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/post`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error || "Failed to create post");
        return;
      }

      setSuccessMessage(payload?.message || "Post created successfully");
      setForm(initialForm);
      setSelectedViewers([]);
      event.target.reset();
      router.push("/posts");
    } catch {
      setErrorMessage("Could not connect to the backend server");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
        <span className="loading-spinner" aria-label="Checking authentication" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-[#111111] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Create Post
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-white/75">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-white/75">
              Content
            </label>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 transition focus-within:border-white/30">
              <textarea
                id="content"
                value={form.content}
                onChange={(event) => updateField("content", event.target.value)}
                rows={6}
                className="min-h-[150px] max-h-[280px] w-full resize-y overflow-y-auto bg-transparent text-white outline-none placeholder:text-white/30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                required
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Add image" title="Add image">
                  <ImageIcon />
                  <input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={(event) => updateField("image", event.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="min-w-0 flex-1 truncate text-right text-sm text-white/50">
                  {form.image?.name || "PNG, JPG, or GIF"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="privacy" className="mb-2 block text-sm font-medium text-white/75">
                Privacy
              </label>
              <select
                id="privacy"
                value={form.privacy}
                onChange={(event) => updateField("privacy", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 pr-11 text-white outline-none transition focus:border-white/30"
              >
                <option value="public">Public</option>
                <option value="almost_private">Almost private</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label htmlFor="hashtags" className="mb-2 block text-sm font-medium text-white/75">
                Hashtags
              </label>
              <input
                id="hashtags"
                type="text"
                value={form.hashtags}
                onChange={(event) => updateField("hashtags", event.target.value)}
                placeholder="#onepiece #anime #manga"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              />
              <p className="mt-2 text-xs text-white/45">Use hashtag format like #go #backend</p>
            </div>
          </div>

          {form.privacy === "private" ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
              {/* Header row */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/75">Allowed viewers</span>
                  {selectedViewers.length > 0 ? (
                    <span className="rounded-full bg-[#fe2c55] px-2 py-0.5 text-[11px] font-bold text-white leading-none">
                      {selectedViewers.length}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/35">Only selected followers can see this post</span>
                  {selectedViewers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedViewers([])}
                      className="text-xs text-white/45 transition hover:text-white/80 underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Search input */}
              {!isLoadingFollowers && followers.length > 0 ? (
                <div className="relative mb-3">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={followerSearch}
                    onChange={(e) => setFollowerSearch(e.target.value)}
                    placeholder="Search followers…"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
                  />
                  {followerSearch ? (
                    <button
                      type="button"
                      onClick={() => setFollowerSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ) : null}

              {/* Follower chips */}
              {isLoadingFollowers ? (
                <p className="py-4 text-center text-sm text-white/40">Loading followers…</p>
              ) : followers.length === 0 ? (
                <p className="py-4 text-center text-sm text-white/40">You have no followers yet.</p>
              ) : (() => {
                const query = followerSearch.trim().toLowerCase();
                const visible = query
                  ? followers.filter((f) => {
                      const name = (f.nickname || `${f.first_name} ${f.last_name}`).toLowerCase();
                      return name.includes(query);
                    })
                  : followers;

                if (visible.length === 0) {
                  return <p className="py-4 text-center text-sm text-white/40">No followers match &quot;{followerSearch}&quot;</p>;
                }

                return (
                  <div className="max-h-52 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                    <div className="flex flex-wrap gap-2 pb-1">
                      {visible.map((follower) => {
                        const isSelected = selectedViewers.includes(follower.user_id);
                        const displayName = follower.nickname || `${follower.first_name} ${follower.last_name}`.trim() || "User";
                        const initials = displayName.charAt(0).toUpperCase();
                        const avatarUrl = follower.avatar_path
                          ? (follower.avatar_path.startsWith("http") ? follower.avatar_path : `${API_BASE_URL}/${follower.avatar_path}`)
                          : null;
                        return (
                          <button
                            key={follower.user_id}
                            type="button"
                            onClick={() => toggleViewer(follower.user_id)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              isSelected
                                ? "border-[#fe2c55]/70 bg-[#fe2c55]/20 text-white"
                                : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
                            }`}
                          >
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isSelected ? "bg-[#fe2c55] text-white" : "bg-white/15 text-white/80"}`}>
                                {initials}
                              </span>
                            )}
                            <span className="max-w-[140px] truncate">{displayName}</span>
                            {isSelected ? (
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#fe2c55]" aria-hidden="true">
                                <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

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
            className="rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating post..." : "Create post"}
          </button>
        </form>
      </div>
    </main>
  );
}
