"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
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

function getInitial(name) {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
}

function formatCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }

  return String(count ?? 0);
}

function getHandle(profile) {
  const nickname = String(profile?.nickname || "").trim();
  if (nickname) {
    return `@${nickname.replace(/\s+/g, "").toLowerCase()}`;
  }

  return `@user${String(profile?.id || "").replace(/-/g, "").slice(0, 8) || "profile"}`;
}

function getDisplayName(profile) {
  const fullName = [profile?.first_name ?? profile?.firstName, profile?.last_name ?? profile?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (profile?.nickname) {
    return profile.nickname;
  }

  return `User ${String(profile?.id || "").replace(/-/g, "").slice(0, 6) || "profile"}`;
}

function AvatarFallback({ label, className }) {
  return (
    <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[3px] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className={`flex items-center justify-center rounded-full border-4 border-black bg-white font-semibold text-black ${className}`}>
        {getInitial(label)}
      </div>
    </span>
  );
}

function buildProfileShareUrl(profile) {
  if (typeof window === "undefined") {
    return "";
  }

  if (profile?.id) {
    return `${window.location.origin}/users/${profile.id}`;
  }

  return window.location.href;
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M8.5 12 15 7m-6.5 5 6.5 5M7 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrivateAccountLockIcon() {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" className="h-10 w-10">
      <path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function renderProfileAvatar(profile, avatarPreviewUrl, isSelf, onAvatarClick) {
  return <ProfileAvatar profile={profile} avatarPreviewUrl={avatarPreviewUrl} isSelf={isSelf} onAvatarClick={onAvatarClick} />;
}

function ProfileAvatar({ profile, avatarPreviewUrl, isSelf, onAvatarClick }) {
  const [failedAvatar, setFailedAvatar] = useState("");
  const avatar = avatarPreviewUrl || profile?.avatar_path;
  const hasImageError = Boolean(avatar) && failedAvatar === avatar;
  const label = getDisplayName(profile) || profile?.id || "User";
  const isOnline = String(profile?.status || "offline").toLowerCase() === "online";
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusDot = (
    <span
      className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-[4px] border-black ${isOnline ? "bg-emerald-400" : "bg-[#ff3b5f]"}`}
      aria-label={statusLabel}
      title={statusLabel}
    />
  );
  const content = avatar && !hasImageError ? (
    <span className="relative inline-flex rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[3px] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <img
        src={normalizeImagePath(avatar)}
        alt={label}
        onError={() => setFailedAvatar(avatar)}
        className="h-28 w-28 rounded-full border-4 border-black object-cover sm:h-32 sm:w-32"
      />
      {statusDot}
    </span>
  ) : (
    <span className="relative inline-flex">
      <AvatarFallback label={label} className="h-28 w-28 text-4xl sm:h-32 sm:w-32" />
      {statusDot}
    </span>
  );

  if (!isSelf || !onAvatarClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onAvatarClick}
      className="group relative rounded-full transition hover:scale-[1.02]"
      aria-label="Change avatar"
    >
      {content}
      <span className="absolute inset-0 flex items-end justify-center rounded-full bg-black/0 pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/0 transition group-hover:bg-black/35 group-hover:text-white">
        Change
      </span>
    </button>
  );
}

function PostTileOwnerMenu({
  post,
  currentUserId,
  onEditPost,
  onDeletePost,
  isOwnerActionLoading = false,
  isDeletePending = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isOwner = Boolean(currentUserId) && currentUserId === post.user_id;

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

  if (!isOwner || (!onEditPost && !onDeletePost)) {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute right-3 top-3 z-10">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        disabled={isOwnerActionLoading || isDeletePending}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Open post actions"
      >
        <DotsIcon />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-11 min-w-[148px] rounded-2xl bg-[#151515] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          {onEditPost ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(false);
                onEditPost(post);
              }}
              disabled={isOwnerActionLoading || isDeletePending}
              className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          ) : null}
          {onDeletePost ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(false);
                onDeletePost(post);
              }}
              disabled={isOwnerActionLoading || isDeletePending}
              className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function renderPostTile(post, options = {}) {
  const href = options.href || `/post/${post.id}`;

  return (
    <Link
      key={post.id}
      href={href}
      onClick={options.onClick}
      className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#111111] transition hover:border-white/20"
    >
      <PostTileOwnerMenu
        post={post}
        currentUserId={options.currentUserId}
        onEditPost={options.onEditPost}
        onDeletePost={options.onDeletePost}
        isOwnerActionLoading={options.isOwnerActionLoading}
        isDeletePending={options.isDeletePending}
      />
      <div className="aspect-[3/4] bg-black">
        {post.image_path ? (
          <img
            src={normalizeImagePath(post.image_path)}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(254,44,85,0.28),transparent_30%),radial-gradient(circle_at_bottom,rgba(37,244,238,0.18),transparent_28%),#0f0f10] p-5 text-center">
            <p className="line-clamp-6 whitespace-pre-wrap text-sm font-medium leading-6 text-white/92 sm:text-base">
              {post.title}
              {post.content ? `\n${post.content}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent px-3 pb-3 pt-12">
        <div className="flex items-end justify-between gap-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{post.title || "Untitled post"}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {post.privacy}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            {formatCount(post.total_views)} views
          </div>
        </div>
      </div>
    </Link>
  );
}

function renderAvatarPreview(profile, avatarPreviewUrl) {
  const avatar = avatarPreviewUrl || profile?.avatar_path;

  if (avatar) {
    return (
      <img
        src={normalizeImagePath(avatar)}
        alt={profile?.nickname || profile?.id}
        className="h-36 w-36 rounded-full object-cover ring-4 ring-white/10"
      />
    );
  }

  return (
    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-5xl font-semibold text-black ring-4 ring-white/10">
      {getInitial(profile?.nickname || profile?.first_name || profile?.id)}
    </div>
  );
}

function getConnectionFullName(user) {
  const fullName = [user?.first_name ?? user?.firstName, user?.last_name ?? user?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  return user?.nickname || "User";
}

function renderConnectionAvatar(user) {
  if (user?.avatar_path) {
    return (
      <img
        src={normalizeImagePath(user.avatar_path)}
        alt={user.nickname || user.user_id}
        className="h-14 w-14 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
      {getInitial(user?.nickname || user?.user_id)}
    </div>
  );
}

export default function ProfileView({
  profile,
  posts,
  isLoading,
  errorMessage,
  isSelf,
  titleLabel,
  onLogin,
  activeTab = "posts",
  onTabChange,
  likedPosts = [],
  repostPosts = [],
  isLikedPostsLoading = false,
  isRepostPostsLoading = false,
  likedPostsError = "",
  repostPostsError = "",
  onEditProfileClick,
  isEditProfileOpen,
  editForm,
  editProfileError,
  isEditProfileSubmitting,
  onEditFormChange,
  onEditProfileSubmit,
  onEditProfileCancel,
  onAvatarClick,
  isAvatarEditorOpen,
  avatarPreviewUrl,
  selectedAvatarName,
  avatarUploadError,
  avatarUploadSuccess,
  isAvatarSubmitting,
  onAvatarFileChange,
  onAvatarSubmit,
  onAvatarCancel,
  followActionLabel,
  onFollowAction,
  onMessageClick,
  onBlockUser,
  onUnblockUser,
  canMessage = true,
  isFollowActionLoading = false,
  followActionError = "",
  isBlockActionLoading = false,
  blockActionError = "",
  isFollowActionDisabled = false,
  isConnectionsModalOpen = false,
  activeConnectionsTab = "following",
  onOpenConnectionsModal,
  onConnectionsTabChange,
  onCloseConnectionsModal,
  connections = [],
  isConnectionsLoading = false,
  connectionsError = "",
  showBlockedConnectionsTab = false,
  onUnblockConnection,
  unblockingUserId = "",
  currentUserId = "",
  onEditPost,
  onDeletePost,
  loadingEditPostId = "",
  deletingPostId = "",
  onBack,
}) {
  const [shareFeedback, setShareFeedback] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [shareRecipients, setShareRecipients] = useState([]);
  const [isShareRecipientsLoading, setIsShareRecipientsLoading] = useState(false);
  const [shareRecipientsError, setShareRecipientsError] = useState("");
  const [sharingRecipientId, setSharingRecipientId] = useState("");
  const shareFeedbackTimeoutRef = useRef(null);
  const profileMenuRef = useRef(null);
  const displayedPosts = activeTab === "liked" ? likedPosts : activeTab === "reposts" ? repostPosts : posts;
  const isGridLoading = isLoading || (activeTab === "liked" && isLikedPostsLoading) || (activeTab === "reposts" && isRepostPostsLoading);
  const gridErrorMessage = activeTab === "liked" ? likedPostsError : activeTab === "reposts" ? repostPostsError : "";
  const isUnfollowAction = !isSelf && (followActionLabel === "Unfollow" || Number(profile?.is_following) === 1);
  const isFollowRequestPending = !isSelf && followActionLabel === "Follow request pending";
  const isBlockedProfile = !isSelf && Boolean(profile?.is_blocked);
  const isPrivateContentLocked =
    !isSelf &&
    !isBlockedProfile &&
    profile &&
    !profile.is_public &&
    Number(profile.is_following) !== 1;
  const connectionsLabel =
    activeConnectionsTab === "followers"
      ? "Followers"
      : activeConnectionsTab === "blocked"
        ? "Blocked"
        : "Following";

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!(profileMenuRef.current instanceof HTMLElement)) {
        return;
      }

      if (profileMenuRef.current.contains(event.target)) {
        return;
      }

      setIsProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isProfileMenuOpen]);

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

  async function handleShareProfile() {
    if (!currentUserId) {
      onLogin?.();
      return;
    }

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

  async function handleSendProfileShare(recipient) {
    if (!recipient?.user_id || !profile?.id) {
      return;
    }

    const shareUrl = buildProfileShareUrl(profile);
    if (!shareUrl) {
      setShareRecipientsError("Unable to build profile link right now.");
      return;
    }

    const profileName = getDisplayName(profile);
    const messageContent = `Check out this profile: ${profileName}\n${shareUrl}`;

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
        throw new Error(payload?.error || "Failed to share profile");
      }

      setIsShareModalOpen(false);
      setTimedShareFeedback(`Profile shared with ${recipient.nickname || recipient.user_id}.`);
    } catch (error) {
      setShareRecipientsError(error.message || "Failed to share profile");
    } finally {
      setSharingRecipientId("");
    }
  }

  function handleOpenProfilePost() {
    const profileHref = isSelf ? "/profile/me" : `/users/${profile?.id}`;

    try {
      window.sessionStorage.setItem(
        "profile-post-viewer",
        JSON.stringify({
          profileHref,
          profileId: profile?.id || "",
          tab: activeTab,
          posts: displayedPosts,
        })
      );
    } catch {}
  }

  return (
    <>
      <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Back to users"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                  <path d="M14.5 6.5 9 12l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            <p className="text-sm uppercase tracking-[0.22em] text-white/45">{titleLabel}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <span className="loading-spinner" aria-label="Loading profile" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">
            <p>{errorMessage}</p>
            {errorMessage.toLowerCase().includes("login") ? (
              <button
                type="button"
                onClick={onLogin}
                className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Go to login
              </button>
            ) : null}
          </div>
        ) : !profile ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            Profile not found.
          </div>
        ) : (
          <div>
            <section className="pb-10">
              <div className="mx-auto max-w-4xl text-center">
                <div className="flex justify-center">
                  {renderProfileAvatar(profile, avatarPreviewUrl, isSelf, onAvatarClick)}
                </div>
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {getDisplayName(profile)}
                </h1>
                <p className="mt-2 text-sm font-medium text-white/55">{getHandle(profile)}</p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white">
                  <div>
                    {onOpenConnectionsModal ? (
                      <button
                        type="button"
                        onClick={() => onOpenConnectionsModal("following")}
                        className="transition hover:text-white/80"
                      >
                        <span className="font-bold text-white">{formatCount(profile.total_following)}</span>
                        <span className="ml-2 text-white/60">Following</span>
                      </button>
                    ) : (
                      <>
                        <span className="font-bold text-white">{formatCount(profile.total_following)}</span>
                        <span className="ml-2 text-white/60">Following</span>
                      </>
                    )}
                  </div>
                  <div>
                    {onOpenConnectionsModal ? (
                      <button
                        type="button"
                        onClick={() => onOpenConnectionsModal("followers")}
                        className="transition hover:text-white/80"
                      >
                        <span className="font-bold text-white">{formatCount(profile.total_followers)}</span>
                        <span className="ml-2 text-white/60">Followers</span>
                      </button>
                    ) : (
                      <>
                        <span className="font-bold text-white">{formatCount(profile.total_followers)}</span>
                        <span className="ml-2 text-white/60">Followers</span>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white">{formatCount(profile.total_posts)}</span>
                    <span className="ml-2 text-white/60">Posts</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {isSelf ? (
                    <button
                      type="button"
                      onClick={onEditProfileClick}
                      className="rounded-xl border border-white/15 bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Edit profile
                    </button>
                  ) : isBlockedProfile ? (
                    <button
                      type="button"
                      onClick={onUnblockUser}
                      disabled={isBlockActionLoading}
                      className="rounded-xl border border-emerald-400/35 bg-emerald-400/12 px-8 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBlockActionLoading ? "Unblocking..." : "Unblock user"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onFollowAction}
                      disabled={isFollowActionDisabled || isFollowActionLoading}
                      className={`rounded-xl px-8 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isFollowRequestPending
                          ? "border border-amber-300/35 bg-amber-300/12 text-amber-100 hover:bg-amber-300/18"
                          : isUnfollowAction
                          ? "border border-white/15 bg-white/8 text-white hover:bg-white/14"
                          : "bg-[#fe2c55] text-white hover:bg-[#e0264b]"
                      }`}
                    >
                      {isFollowActionLoading
                        ? "Please wait..."
                        : followActionLabel ||
                          (Number(profile.is_following) === 1
                            ? "Following"
                            : profile.is_public
                              ? "Follow"
                              : "Request follow")}
                    </button>
                  )}
                  {!isSelf && !isBlockedProfile && canMessage ? (
                    <button
                      type="button"
                      onClick={onMessageClick}
                      className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Message
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    <ShareIcon />
                    Share
                  </button>
                  {!isSelf && !isBlockedProfile && onBlockUser ? (
                    <div ref={profileMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsProfileMenuOpen((current) => !current)}
                        disabled={isBlockActionLoading}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-lg text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Open profile actions"
                      >
                        <DotsIcon />
                      </button>
                      {isProfileMenuOpen ? (
                        <div className="absolute right-0 top-12 min-w-[148px] rounded-2xl bg-[#151515] p-2 text-left shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onBlockUser();
                            }}
                            disabled={isBlockActionLoading}
                            className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBlockActionLoading ? "Blocking..." : "Block user"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {shareFeedback ? (
                  <p className="mt-4 text-sm text-white/58">{shareFeedback}</p>
                ) : null}

                {profile.about_me ? (
                  <div className="mt-6 space-y-2 text-sm text-white/72">
                    <p>{profile.about_me}</p>
                  </div>
                ) : null}

                {!isSelf && followActionError ? (
                  <p className="mt-4 text-sm text-red-300">{followActionError}</p>
                ) : null}

                {!isSelf && blockActionError ? (
                  <p className="mt-2 text-sm text-red-300">{blockActionError}</p>
                ) : null}
              </div>
            </section>

            <section className="border-t border-white/10">
              <div className="mx-auto flex max-w-4xl items-center justify-center gap-10 px-4 pt-4 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => onTabChange?.("posts")}
                  className={activeTab === "posts" ? "border-b-2 border-white px-2 py-3 text-white" : "px-2 py-3 text-white/35 transition hover:text-white/60"}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange?.("reposts")}
                  className={activeTab === "reposts" ? "border-b-2 border-white px-2 py-3 text-white" : "px-2 py-3 text-white/35 transition hover:text-white/60"}
                >
                  Reposts
                </button>
                {isSelf ? (
                  <button
                    type="button"
                    onClick={() => onTabChange?.("liked")}
                    className={activeTab === "liked" ? "border-b-2 border-white px-2 py-3 text-white" : "px-2 py-3 text-white/35 transition hover:text-white/60"}
                  >
                    Liked
                  </button>
                ) : null}
                {showBlockedConnectionsTab && onOpenConnectionsModal ? (
                  <button
                    type="button"
                    onClick={() => onOpenConnectionsModal("blocked")}
                    className="px-2 py-3 text-white/35 transition hover:text-white/60"
                  >
                    Blocked
                  </button>
                ) : null}
              </div>

              <div className="mx-auto mt-4 max-w-5xl">
                {isPrivateContentLocked ? (
                  <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/75">
                      <PrivateAccountLockIcon />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-white">This account is private</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
                      Follow this account to see their posts and reposts.
                    </p>
                  </div>
                ) : isGridLoading ? (
                  <div className="flex min-h-80 items-center justify-center">
                    <span className="loading-spinner" aria-label="Loading posts" />
                  </div>
                ) : gridErrorMessage ? (
                  <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-10 text-center text-red-200">
                    {gridErrorMessage}
                  </div>
                ) : displayedPosts.length === 0 ? (
                  <div className="border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
                    {activeTab === "liked" ? "No liked posts yet." : activeTab === "reposts" ? "No reposts yet." : "No posts yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
                    {displayedPosts.map((post) =>
                      renderPostTile(post, {
                        href: `/post/${post.id}?source=profile&tab=${activeTab}`,
                        onClick: handleOpenProfilePost,
                        currentUserId,
                        onEditPost,
                        onDeletePost,
                        isOwnerActionLoading: loadingEditPostId === post.id,
                        isDeletePending: deletingPostId === post.id,
                      })
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {isSelf && isEditProfileOpen ? (
        <div
          className="profile-modal-backdrop theme-scrollbar fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md sm:py-10"
          onClick={onEditProfileCancel}
        >
          <section
            className="profile-edit-modal my-auto w-full max-w-2xl rounded-[28px] border border-white/10 p-5 text-left shadow-[0_36px_100px_rgba(0,0,0,0.72)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-6">
              <div className="flex items-center gap-4">

                <div>
                  <p className="text-xl font-bold tracking-tight text-white">Edit profile</p>
                  <p className="mt-1 text-sm text-white/50">
                    Update your public profile details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEditProfileCancel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-white/60 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                aria-label="Close profile editor"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/50">Nickname</label>
                <input
                  type="text"
                  value={editForm?.nickname || ""}
                  onChange={(event) => onEditFormChange("nickname", event.target.value)}
                  className="profile-edit-input"
                />
              </div>
              <label className="auth-privacy-card cursor-pointer rounded-2xl px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.055]">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">Public profile</span>
                  <span className="mt-1 block text-xs leading-5 text-white/40">
                    Anyone can view your posts. Turn this off to approve followers first.
                  </span>
                </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editForm?.isPublic)}
                    onChange={(event) => onEditFormChange("isPublic", event.target.checked)}
                    className="peer sr-only"
                  />
                <span className="auth-switch" aria-hidden="true"><span /></span>
              </label>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/50">First name</label>
                <input
                  type="text"
                  value={editForm?.firstName || ""}
                  onChange={(event) => onEditFormChange("firstName", event.target.value)}
                  className="profile-edit-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/50">Last name</label>
                <input
                  type="text"
                  value={editForm?.lastName || ""}
                  onChange={(event) => onEditFormChange("lastName", event.target.value)}
                  className="profile-edit-input"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/50">About me</label>
                  <span className="text-xs text-white/30">{(editForm?.aboutMe || "").length}/500</span>
                </div>
                <textarea
                  value={editForm?.aboutMe || ""}
                  onChange={(event) => onEditFormChange("aboutMe", event.target.value)}
                  rows={4}
                  maxLength={500}
                  className="profile-edit-input min-h-28 resize-none"
                />
              </div>
            </div>

            {editProfileError ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {editProfileError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onEditProfileSubmit}
                disabled={isEditProfileSubmitting}
                className="rounded-xl bg-[linear-gradient(135deg,#fe2c55,#d91f45)] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(254,44,85,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(254,44,85,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditProfileSubmitting ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={onEditProfileCancel}
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}

        {isSelf && isAvatarEditorOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={onAvatarCancel}
          >
            <section
              className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#111111] p-5 text-left shadow-[0_32px_80px_rgba(0,0,0,0.55)] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Change avatar</p>
                <p className="mt-1 text-sm text-white/55">
                  Upload a JPG, PNG, or GIF up to 20MB.
                </p>
              </div>
              <button
                type="button"
                onClick={onAvatarCancel}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-7">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                {renderAvatarPreview(profile, avatarPreviewUrl)}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedAvatarName ? "Selected preview" : "Current avatar"}
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    {selectedAvatarName || "Choose an image to preview it here before saving."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/20 px-5 py-4 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/5">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden"
                  onChange={onAvatarFileChange}
                />
                Choose image
              </label>
              <p className="min-h-6 text-sm text-white/60">
                {selectedAvatarName || "No file selected"}
              </p>
            </div>

            {avatarUploadError ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {avatarUploadError}
              </div>
            ) : null}

            {avatarUploadSuccess ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {avatarUploadSuccess}
              </div>
            ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onAvatarSubmit}
                  disabled={!selectedAvatarName || isAvatarSubmitting}
                  className="rounded-xl bg-[#fe2c55] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAvatarSubmitting ? "Saving..." : "Save avatar"}
                </button>
                <button
                  type="button"
                  onClick={onAvatarCancel}
                  className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {isConnectionsModalOpen && profile ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={onCloseConnectionsModal}
          >
            <section
              className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] text-left shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold text-white">
                    {profile.nickname || getDisplayName(profile)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onCloseConnectionsModal}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="flex border-b border-white/10 px-5 sm:px-6">
                <button
                  type="button"
                  onClick={() => onConnectionsTabChange?.("following")}
                  className={activeConnectionsTab === "following" ? "border-b-2 border-white px-4 py-4 text-sm font-semibold text-white" : "px-4 py-4 text-sm font-semibold text-white/35 transition hover:text-white/60"}
                >
                  Following {formatCount(profile.total_following)}
                </button>
                <button
                  type="button"
                  onClick={() => onConnectionsTabChange?.("followers")}
                  className={activeConnectionsTab === "followers" ? "border-b-2 border-white px-4 py-4 text-sm font-semibold text-white" : "px-4 py-4 text-sm font-semibold text-white/35 transition hover:text-white/60"}
                >
                  Followers {formatCount(profile.total_followers)}
                </button>
                {showBlockedConnectionsTab ? (
                  <button
                    type="button"
                    onClick={() => onConnectionsTabChange?.("blocked")}
                    className={activeConnectionsTab === "blocked" ? "border-b-2 border-white px-4 py-4 text-sm font-semibold text-white" : "px-4 py-4 text-sm font-semibold text-white/35 transition hover:text-white/60"}
                  >
                    Blocked
                  </button>
                ) : null}
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
                {isConnectionsLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                    Loading {connectionsLabel.toLowerCase()}...
                  </div>
                ) : connectionsError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-sm text-red-200">
                    {connectionsError}
                  </div>
                ) : connections.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                    No {connectionsLabel.toLowerCase()} yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {connections.map((user) => (
                      <Link
                        key={`${activeConnectionsTab}-${user.user_id}`}
                        href={user.user_id === profile.id ? "/profile/me" : `/users/${user.user_id}`}
                        className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {renderConnectionAvatar(user)}
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-white">
                              {user.nickname || user.user_id}
                            </p>
                            <p className="truncate text-sm text-white/45">{getConnectionFullName(user)}</p>
                          </div>
                        </div>
                        {activeConnectionsTab === "blocked" && onUnblockConnection ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onUnblockConnection(user.user_id);
                            }}
                            disabled={unblockingUserId === user.user_id}
                            className="shrink-0 rounded-xl border border-emerald-400/35 bg-emerald-400/12 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {unblockingUserId === user.user_id ? "Unblocking..." : "Unblock"}
                          </button>
                        ) : (
                          <div className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/85">
                            {activeConnectionsTab === "following"
                              ? "Following"
                              : activeConnectionsTab === "blocked"
                                ? "Blocked"
                                : "Profile"}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {isShareModalOpen && profile ? (
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
                  <h2 className="truncate text-2xl font-semibold text-white">Share Profile</h2>
                  <p className="mt-1 text-sm text-white/55">Send this profile to someone you follow.</p>
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
                        key={`share-${user.user_id}`}
                        className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {renderConnectionAvatar(user)}
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-white">
                              {user.nickname || user.user_id}
                            </p>
                            <p className="truncate text-sm text-white/45">{getConnectionFullName(user)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendProfileShare(user)}
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
      </main>
    </>
  );
}
