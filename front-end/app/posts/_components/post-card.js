"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

export function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("./")) {
    return `${API_BASE_URL}/${imagePath.slice(2)}`;
  }

  if (imagePath.startsWith("/")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  return `${API_BASE_URL}/${imagePath}`;
}

export function getInitial(name) {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
}

export function formatCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }

  return String(count ?? 0);
}

export function PostProfileLink({ userId, label, className }) {
  return (
    <Link href={`/users/${userId}`} className={className}>
      {label}
    </Link>
  );
}

function buildPostShareUrl(post) {
  if (typeof window === "undefined") {
    return "";
  }

  if (post?.id) {
    return `${window.location.origin}/post/${post.id}`;
  }

  return window.location.href;
}

function getSharePostLabel(post) {
  if (post?.title?.trim()) {
    return post.title.trim();
  }

  if (post?.nickname?.trim()) {
    return `${post.nickname.trim()}'s post`;
  }

  return "this post";
}

function PostAvatar({ avatarPath, label, sizeClassName }) {
  const normalizedPath = avatarPath?.trim();

  if (normalizedPath) {
    return (
      <img
        src={normalizeImagePath(normalizedPath)}
        alt={label}
        className={`${sizeClassName} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-white text-sm font-semibold text-black ${sizeClassName}`}
    >
      {getInitial(label)}
    </div>
  );
}

function PostOwnerMenu({
  post,
  currentUserId,
  onEditPost,
  onDeletePost,
  onBlockUser,
  isDeletePending = false,
  isBlockPending = false,
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRecipients, setShareRecipients] = useState([]);
  const [isShareRecipientsLoading, setIsShareRecipientsLoading] = useState(false);
  const [shareRecipientsError, setShareRecipientsError] = useState("");
  const [sharingRecipientId, setSharingRecipientId] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const shareFeedbackTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const isOwner = Boolean(currentUserId) && currentUserId === post.user_id;
  const canEdit = isOwner && Boolean(onEditPost);
  const canDelete = isOwner && Boolean(onDeletePost);
  const canBlock = Boolean(currentUserId) && !isOwner && Boolean(onBlockUser);
  const canShare = Boolean(currentUserId);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!(containerRef.current instanceof HTMLElement)) {
        return;
      }

      if (containerRef.current.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  async function loadShareRecipients() {
    setIsShareRecipientsLoading(true);
    setShareRecipientsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/following?limit=100`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load following users");
      }

      setShareRecipients(payload?.data?.users || []);
    } catch (error) {
      setShareRecipients([]);
      setShareRecipientsError(error.message || "Failed to load following users");
    } finally {
      setIsShareRecipientsLoading(false);
    }
  }

  function setTimedShareFeedback(message) {
    setShareFeedback(message);

    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }

    shareFeedbackTimeoutRef.current = window.setTimeout(() => {
      shareFeedbackTimeoutRef.current = null;
      setShareFeedback("");
    }, 2500);
  }

  async function handleSharePost() {
    setIsOpen(false);
    setIsShareModalOpen(true);
    setShareFeedback("");

    if (!shareRecipients.length && !isShareRecipientsLoading) {
      await loadShareRecipients();
    }
  }

  function handleCloseShareModal() {
    if (sharingRecipientId) {
      return;
    }

    setIsShareModalOpen(false);
    setShareRecipientsError("");
  }

  async function handleSendPostShare(recipient) {
    if (!recipient?.user_id || !post?.id) {
      return;
    }

    const shareUrl = buildPostShareUrl(post);
    if (!shareUrl) {
      setShareRecipientsError("Unable to build post link right now.");
      return;
    }

    const messageContent = `Check out ${getSharePostLabel(post)}\n${shareUrl}`;

    setSharingRecipientId(recipient.user_id);
    setShareRecipientsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/private/${recipient.user_id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to share post");
      }

      setIsShareModalOpen(false);
      setTimedShareFeedback(`Post shared with ${recipient.nickname || recipient.user_id}.`);
    } catch (error) {
      setShareRecipientsError(error.message || "Failed to share post");
    } finally {
      setSharingRecipientId("");
    }
  }

  if (!canEdit && !canDelete && !canBlock && !canShare) {
    return null;
  }

  return (
    <>
      <div ref={containerRef} className="pointer-events-auto absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          disabled={isLoading || isDeletePending || isBlockPending || Boolean(sharingRecipientId)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-lg text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Open post actions"
        >
          ...
        </button>
        {isOpen ? (
          <div className="absolute right-0 top-12 min-w-[148px] rounded-2xl bg-[#151515] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onEditPost(post);
                }}
                disabled={isLoading || isDeletePending || isBlockPending || Boolean(sharingRecipientId)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit
              </button>
            ) : null}
            {canShare ? (
              <button
                type="button"
                onClick={() => {
                  void handleSharePost();
                }}
                disabled={isLoading || isDeletePending || isBlockPending || Boolean(sharingRecipientId)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Share
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDeletePost(post);
                }}
                disabled={isLoading || isDeletePending || isBlockPending || Boolean(sharingRecipientId)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletePending ? "Deleting..." : "Delete"}
              </button>
            ) : null}
            {canBlock ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onBlockUser(post);
                }}
                disabled={isLoading || isDeletePending || isBlockPending || Boolean(sharingRecipientId)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBlockPending ? "Blocking..." : "Block user"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {shareFeedback ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <p className="rounded-full border border-white/10 bg-black/65 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
            {shareFeedback}
          </p>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={handleCloseShareModal}
        >
          <section
            className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] text-left shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold text-white">Share Post</h2>
                <p className="mt-1 text-sm text-white/55">Send this post to someone you follow.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseShareModal}
                disabled={Boolean(sharingRecipientId)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="theme-scrollbar max-h-[60vh] overflow-y-auto px-5 py-4 sm:px-6">
              {isShareRecipientsLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                  Loading following users...
                </div>
              ) : shareRecipientsError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-sm text-red-200">
                  {shareRecipientsError}
                </div>
              ) : shareRecipients.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                  You are not following anyone yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {shareRecipients.map((user) => (
                    <div
                      key={`share-${post.id}-${user.user_id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <PostAvatar
                          avatarPath={user.avatar_path}
                          label={user.nickname || user.user_id}
                          sizeClassName="h-14 w-14"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">
                            {user.nickname || user.user_id}
                          </p>
                          <p className="truncate text-sm text-white/45">
                            {[user.first_name, user.last_name].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendPostShare(user)}
                        disabled={Boolean(sharingRecipientId)}
                        className="shrink-0 rounded-xl bg-[#fe2c55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sharingRecipientId === user.user_id ? "Sharing..." : "Send"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PostActionRail({
  post,
  containerClassName,
  mode,
  isLikePending = false,
  isRepostPending = false,
  isCommentsActive = false,
  onLikeToggle,
  onRepostToggle,
  onCommentsToggle,
}) {
  if (mode === "none") {
    return null;
  }

  const isInteractive = mode === "interactive";
  const isLiked = Number(post.is_liked) === 1;
  const isReposted = Number(post.is_reposted) === 1;
  const railTone = isInteractive && isLiked ? "bg-[#fe2c55] text-white" : "bg-white/10 text-white/75";
  const repostTone = isInteractive && isReposted ? "bg-[#25f4ee] text-black" : "bg-white/10 text-white/75";

  function preventPointerFocus(event) {
    event.preventDefault();
  }

  return (
    <div className={containerClassName}>
      <div className="shrink-0 self-center">
        <Link
          href={`/users/${post.user_id}`}
          className="block transition hover:opacity-85"
          aria-label={`Open ${post.nickname || post.user_id} profile`}
        >
          <PostAvatar
            avatarPath={post.avatar_path}
            label={post.nickname || post.user_id}
            sizeClassName="h-12 w-12"
          />
        </Link>
      </div>
      <div className="flex min-w-[52px] flex-col items-center text-center text-xs text-white/75">
        {isInteractive ? (
          <button
            type="button"
            onMouseDown={preventPointerFocus}
            onClick={() => onLikeToggle?.(post)}
            disabled={isLikePending}
            className={`flex h-12 w-12 items-center justify-center rounded-full ${railTone} transition disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isLikePending ? "..." : "L"}
          </button>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/75">
            L
          </div>
        )}
        <span className="mt-2">{formatCount(post.total_likes)}</span>
      </div>
      <div className="flex min-w-[52px] flex-col items-center text-center text-xs text-white/75">
        {isInteractive ? (
          <button
            type="button"
            onMouseDown={preventPointerFocus}
            onClick={() => onCommentsToggle?.(post)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              isCommentsActive ? "bg-white text-black" : "bg-white/10 text-white/75"
            }`}
          >
            C
          </button>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/75">
            C
          </div>
        )}
        <span className="mt-2">{formatCount(post.total_comments)}</span>
      </div>
      <div className="flex min-w-[52px] flex-col items-center text-center text-xs text-white/75">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/75">
          V
        </div>
        <span className="mt-2">{formatCount(post.total_views)}</span>
      </div>
      <div className="flex min-w-[52px] flex-col items-center text-center text-xs text-white/75">
        {isInteractive ? (
          <button
            type="button"
            onMouseDown={preventPointerFocus}
            onClick={() => onRepostToggle?.(post)}
            disabled={isRepostPending}
            className={`flex h-12 w-12 items-center justify-center rounded-full ${repostTone} text-[11px] font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isRepostPending ? "..." : "RP"}
          </button>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            RP
          </div>
        )}
      </div>
      {post.is_edited ? (
        <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
          Edited
        </div>
      ) : null}
    </div>
  );
}

function PostHashtags({ hashtags, mode, onHashtagClick, postId }) {
  if (!hashtags?.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {hashtags.map((hashtag) => {
        if (mode === "button") {
          return (
            <button
              type="button"
              onClick={() => onHashtagClick?.(hashtag)}
              key={`${postId}-${hashtag}`}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              #{hashtag}
            </button>
          );
        }

        return (
          <Link
            href={`/hashtags/${encodeURIComponent(hashtag)}`}
            key={`${postId}-${hashtag}`}
            onClick={(event) => {
              if (!onHashtagClick) {
                return;
              }

              event.preventDefault();
              onHashtagClick(hashtag);
            }}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
          >
            #{hashtag}
          </Link>
        );
      })}
    </div>
  );
}

function ExpandableContent({ content, textClassName }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group relative mt-6 w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.05]">
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "max-h-64 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "max-h-32 overflow-hidden"
        }`}
      >
        <p className={`select-text whitespace-pre-wrap break-all ${textClassName}`}>{content}</p>
      </div>
      {!isExpanded ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#161616] to-transparent" />
      ) : null}
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40"
      >
        {isExpanded ? "less" : "more"}
      </button>
    </div>
  );
}

function ImageOverlay({ post, hashtagMode, onHashtagClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-16 sm:p-6 sm:pt-24">
      <div className="pointer-events-auto w-full max-w-3xl text-left transition">
        <PostProfileLink
          userId={post.user_id}
          label={post.nickname || post.user_id}
          className="text-xl font-semibold text-white transition hover:text-white/80 sm:text-2xl"
        />
        <div
          className={`mt-3 transition-all duration-300 ${
            isExpanded ? "max-h-40 overflow-y-auto pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "max-h-14 overflow-hidden"
          }`}
        >
          <p className="select-text whitespace-pre-wrap break-all text-sm leading-7 text-white/90 sm:text-base">
            {post.title}
            {post.content ? `\n${post.content}` : ""}
          </p>
        </div>
        <PostHashtags
          hashtags={post.hashtags}
          mode={hashtagMode}
          onHashtagClick={onHashtagClick}
          postId={post.id}
        />
        <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/75">
          <span className="truncate">{new Date(post.created_at).toLocaleDateString()}</span>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="shrink-0 font-semibold text-white"
          >
            {isExpanded ? "less" : "more"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoImageStage({ post, hashtagMode, onHashtagClick }) {
  return (
    <div className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(254,44,85,0.24),transparent_32%),radial-gradient(circle_at_bottom,rgba(37,244,238,0.16),transparent_28%),#0e0e0e] px-6 py-16 text-center max-[1024px]:pr-28 sm:px-10">
      <div className="mx-auto w-full max-w-[36rem]">
        <h2 className="mt-4 text-3xl font-semibold text-white">{post.title}</h2>
        <ExpandableContent content={post.content} textClassName="text-base leading-8 text-white/78" />
        <div className={hashtagMode === "button" ? "flex justify-center" : "flex justify-center"}>
          <PostHashtags
            hashtags={post.hashtags}
            mode={hashtagMode}
            onHashtagClick={onHashtagClick}
            postId={post.id}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="text-left">
          <PostProfileLink
            userId={post.user_id}
            label={post.nickname || post.user_id}
            className="pointer-events-auto block font-semibold text-white transition hover:text-white/80"
          />
          <p className="mt-2 text-xs text-white/35">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export function FeedPostCard({
  post,
  articleProps,
  articleClassName,
  actionRailMode = "none",
  hashtagMode = "button",
  currentUserId = "",
  onHashtagClick,
  onLikeToggle,
  onRepostToggle,
  onCommentsToggle,
  onEditPost,
  onDeletePost,
  onBlockUser,
  isOwnerActionLoading = false,
  isDeletePending = false,
  isBlockPending = false,
  isLikePending = false,
  isRepostPending = false,
  activeCommentsPostId = "",
}) {
  const showRails = actionRailMode !== "none";
  const resolvedArticleClassName =
    articleClassName ||
    (showRails
      ? "mx-auto grid min-h-[100dvh] w-full max-w-4xl snap-start content-center gap-4 py-0 lg:grid-cols-[minmax(0,640px)_110px]"
      : "mx-auto w-full max-w-4xl py-2");

  return (
    <article className={resolvedArticleClassName} {...articleProps}>
      <div className="overflow-hidden bg-[#101010] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="relative flex min-h-[100dvh] items-center justify-center bg-black">
          <PostOwnerMenu
            post={post}
            currentUserId={currentUserId}
            onEditPost={onEditPost}
            onDeletePost={onDeletePost}
            onBlockUser={onBlockUser}
            isLoading={isOwnerActionLoading}
            isDeletePending={isDeletePending}
            isBlockPending={isBlockPending}
          />
          {post.image_path ? (
            <>
              <img
                src={normalizeImagePath(post.image_path)}
                alt={post.title}
                className="h-[100dvh] w-full object-contain"
              />
              <ImageOverlay post={post} hashtagMode={hashtagMode} onHashtagClick={onHashtagClick} />
            </>
          ) : (
            <NoImageStage post={post} hashtagMode={hashtagMode} onHashtagClick={onHashtagClick} />
          )}

          {showRails ? (
            <PostActionRail
              post={post}
              mode={actionRailMode}
              isLikePending={isLikePending}
              isRepostPending={isRepostPending}
              isCommentsActive={activeCommentsPostId === post.id}
              onLikeToggle={onLikeToggle}
              onRepostToggle={onRepostToggle}
              onCommentsToggle={onCommentsToggle}
              containerClassName="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 px-2 py-4 max-[1024px]:flex"
            />
          ) : null}
        </div>
      </div>

      {showRails ? (
        <PostActionRail
          post={post}
          mode={actionRailMode}
          isLikePending={isLikePending}
          isRepostPending={isRepostPending}
          isCommentsActive={activeCommentsPostId === post.id}
          onLikeToggle={onLikeToggle}
          onRepostToggle={onRepostToggle}
          onCommentsToggle={onCommentsToggle}
          containerClassName="hidden items-center justify-center gap-5 px-2 pb-2 min-[1025px]:flex lg:flex-col lg:justify-end lg:gap-4 lg:px-0 lg:pb-14"
        />
      ) : null}
    </article>
  );
}