"use client";

import { useEffect, useState } from "react";
import { normalizeImagePath } from "@/app/posts/_components/post-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

function parseHashtags(input) {
  return input
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("#") && item.length > 1)
    .map((item) => item.replace(/^#+/, ""))
    .filter(Boolean);
}

function buildPostForm(post) {
  return {
    title: post?.title || "",
    content: post?.content || "",
    privacy: post?.privacy || "public",
    hashtags: (post?.hashtags || []).map((tag) => `#${tag}`).join(" "),
    image: null,
    removeImage: false,
  };
}

export default function PostEditModal({
  post,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => buildPostForm(post));
  const [selectedViewers, setSelectedViewers] = useState(() => post?.allowed_viewers || []);
  const [followers, setFollowers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");

  useEffect(() => {
    if (!post) return;
    queueMicrotask(() => {
      setForm(buildPostForm(post));
      setSelectedViewers(post.allowed_viewers || []);
    });
  }, [post]);

  // Fetch followers when privacy is "private"
  useEffect(() => {
    if (form.privacy !== "private") return;
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        setIsLoadingFollowers(true);
      }
    });

    fetch(`${API_BASE_URL}/api/followers?limit=100`, { credentials: "include" })
      .then((r) => r.json().catch(() => null))
      .then((payload) => {
        if (!ignore && payload?.success) {
          setFollowers(payload.data?.users ?? []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setIsLoadingFollowers(false); });

    return () => { ignore = true; };
  }, [form.privacy]);

  if (!post) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleViewer(userId) {
    setSelectedViewers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.({
      title: form.title,
      content: form.content,
      privacy: form.privacy,
      hashtags: parseHashtags(form.hashtags),
      allowedViewers: form.privacy === "private" ? selectedViewers : [],
      image: form.image,
      imagePath: form.removeImage ? "" : post.image_path || "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#111111] p-6 text-left shadow-[0_32px_80px_rgba(0,0,0,0.55)] max-h-[calc(100vh-3rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Edit post</p>
            <p className="mt-1 text-sm text-white/55">Update your post and save changes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label htmlFor="edit-post-title" className="mb-2 block text-sm font-medium text-white/75">
              Title
            </label>
            <input
              id="edit-post-title"
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-post-content" className="mb-2 block text-sm font-medium text-white/75">
              Content
            </label>
            <textarea
              id="edit-post-content"
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={5}
              className="min-h-[140px] max-h-[260px] w-full resize-y overflow-y-auto rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-post-privacy" className="mb-2 block text-sm font-medium text-white/75">
                Privacy
              </label>
              <select
                id="edit-post-privacy"
                value={form.privacy}
                onChange={(event) => updateField("privacy", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/30"
              >
                <option value="public">Public</option>
                <option value="almost_private">Almost private</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-post-hashtags" className="mb-2 block text-sm font-medium text-white/75">
                Hashtags
              </label>
              <input
                id="edit-post-hashtags"
                type="text"
                value={form.hashtags}
                onChange={(event) => updateField("hashtags", event.target.value)}
                placeholder="#onepiece #anime #manga"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              />
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

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/20 px-5 py-4 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/5">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(event) => updateField("image", event.target.files?.[0] || null)}
                  className="hidden"
                />
                Replace image
              </label>
              <p className="min-h-6 text-sm text-white/50">
                {form.image?.name || (post.image_path ? "Current image attached" : "PNG, JPG, or GIF up to 20MB")}
              </p>
            </div>

            {post.image_path && !form.image ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                <img
                  src={normalizeImagePath(post.image_path)}
                  alt={post.title || "Post image"}
                  className="h-28 w-full rounded-2xl object-cover"
                />
                <label className="inline-flex items-center gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={form.removeImage}
                    onChange={(event) => updateField("removeImage", event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Remove current image
                </label>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
