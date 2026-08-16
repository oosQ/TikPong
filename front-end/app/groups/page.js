"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EmojiPicker from "emoji-picker-react";
import { normalizeImagePath } from "@/app/posts/_components/post-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";
const GROUP_LIMIT = 50;
const GROUP_TYPING_IDLE_MS = 1800;
const GROUP_TYPING_REMOTE_TIMEOUT_MS = 4000;
const DEFAULT_TAB_OPTIONS = [
  { id: "members", label: "Members" },
  { id: "posts", label: "Posts" },
  { id: "chat", label: "Group Chat" },
  { id: "events", label: "Events" },
];

function buildWebSocketUrl(baseUrl) {
  if (!baseUrl) {
    return "";
  }

  if (baseUrl.startsWith("https://")) {
    return `${baseUrl.replace(/^https:\/\//, "wss://")}/ws`;
  }

  if (baseUrl.startsWith("http://")) {
    return `${baseUrl.replace(/^http:\/\//, "ws://")}/ws`;
  }

  return `${baseUrl}/ws`;
}

function sortGroupsByLatestActivity(items) {
  return [...items].sort((left, right) => {
    const leftTime = left?.last_activity ? new Date(left.last_activity).getTime() : 0;
    const rightTime = right?.last_activity ? new Date(right.last_activity).getTime() : 0;

    return rightTime - leftTime;
  });
}

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

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });
  const payload = await parseResponse(response);

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error || payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? null;
}

function formatRelativeDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatLongDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCreatedDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitial(label) {
  const value = String(label || "").trim();
  if (!value) {
    return "G";
  }

  return value.charAt(0).toUpperCase();
}

function GroupAvatar({ avatarPath, label, sizeClassName = "h-12 w-12 text-sm" }) {
  const src = normalizeImagePath(avatarPath || "");

  if (src) {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px] shadow-[0_14px_38px_rgba(0,0,0,0.35)]">
        <img src={src} alt={label} className={`${sizeClassName} rounded-full border-4 border-black object-cover`} />
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px] shadow-[0_14px_38px_rgba(0,0,0,0.35)]">
      <div className={`flex items-center justify-center rounded-full border-4 border-black bg-white text-black font-semibold ${sizeClassName}`}>
        {getInitial(label)}
      </div>
    </span>
  );
}

function UserAvatar({ avatarPath, label, status }) {
  const src = normalizeImagePath(avatarPath || "");
  const normalizedStatus = String(status || "offline").toLowerCase();
  const isOnline = normalizedStatus === "online";
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusDot = (
    <span
      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${isOnline ? "bg-emerald-400" : "bg-[#ff3b5f]"}`}
      aria-label={statusLabel}
      title={statusLabel}
    />
  );

  if (src) {
    return (
      <span className="relative inline-flex shrink-0 rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px]">
        <img src={src} alt={label} className="h-10 w-10 rounded-full border-2 border-black object-cover" />
        {statusDot}
      </span>
    );
  }

  return (
    <span className="relative inline-flex shrink-0 rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-sm font-semibold text-black">
        {getInitial(label)}
      </div>
      {statusDot}
    </span>
  );
}

function ChatAvatar({ avatarPath, label }) {
  const src = normalizeImagePath(avatarPath || "");
  if (src) {
    return <img src={src} alt={label} className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
      {getInitial(label)}
    </span>
  );
}

function GroupTypingDots() {
  return (
    <span className="flex h-5 items-center gap-1" aria-label="Typing">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/75 [animation-delay:-300ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45" />
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] px-6 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/50">{description}</p>
    </div>
  );
}

function LoginRequiredState({ title = "Log in to continue", description = "Sign in to access this area and see your social activity." }) {
  return (
    <section className="flex min-h-[52vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white/90"
        >
          Log in
        </Link>
      </div>
    </section>
  );
}

function LoadingState({ label }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/55">
      {label}
    </div>
  );
}

function formatMemberCount(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "";
  }

  return `${value} member${value === 1 ? "" : "s"}`;
}

function parseCount(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function getRawMemberCount(group) {
  return group?.member_count ?? group?.memberCount ?? group?.members_count ?? group?.total_members;
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MemberIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M8 11.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM16.5 10a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM4.5 18.5a3.5 3.5 0 0 1 7 0M13 18a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M7 4v3M17 4v3M4.5 9.5h15M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-20 w-20 text-white/14">
      <path
        d="M6 7.5h12A2.5 2.5 0 0 1 20.5 10v6A2.5 2.5 0 0 1 18 18.5H9l-4.5 3V10A2.5 2.5 0 0 1 7 7.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M6 12h.01M12 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

function SmileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 14c.8 1.3 2.05 2 3.5 2s2.7-.7 3.5-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4 11.5 19 4l-4.2 16-2.8-6-8-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function parseSharedProfile(content) {
  const text = String(content || "").trim();
  if (!text.startsWith("Check out this profile: ")) return null;
  const urlMatch = text.match(/(https?:\/\/\S+\/users\/([a-f0-9-]{36}))/);
  if (!urlMatch) return null;
  const url = urlMatch[1];
  const userId = urlMatch[2];
  const label = text.replace(/^Check out this profile: /, "").split("\n")[0].trim();
  return { label, url, userId };
}

function SharedProfileCard({ label, url, userId, isOwnMessage }) {
  const [avatarPath, setAvatarPath] = useState(null);
  const [displayName, setDisplayName] = useState(label);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/users/${userId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          const u = data.data;
          if (u.avatar_path) setAvatarPath(u.avatar_path);
          const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.nickname || label;
          setDisplayName(name);
        }
      })
      .catch(() => {});
  }, [userId]);

  const initial = String(displayName || "U").trim().charAt(0).toUpperCase();

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex w-[260px] items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 transition ${
        isOwnMessage
          ? "border-white/15 bg-white/8 hover:bg-white/12"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
      }`}
    >
      {avatarPath ? (
        <img src={normalizeImagePath(avatarPath)} alt={displayName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isOwnMessage ? "bg-white/15 text-white" : "bg-white/10 text-white"
        }`}>{initial}</div>
      )}
      <div className="min-w-0">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
          isOwnMessage ? "text-white/40" : "text-white/40"
        }`}>Shared Profile</p>
        <p className={`truncate text-sm font-semibold ${
          isOwnMessage ? "text-white" : "text-white"
        }`}>{displayName}</p>
      </div>
    </a>
  );
}

function parseSharedPost(content) {
  const text = String(content || "").trim();
  if (!text.startsWith("Check out ")) return null;
  const urlMatch = text.match(/(https?:\/\/\S+\/post\/([a-f0-9-]{36}))/);
  if (!urlMatch) return null;
  const url = urlMatch[1];
  const postId = urlMatch[2];
  const label = text.replace(/^Check out /, "").split("\n")[0].trim();
  return { label, url, postId };
}

function SharedPostCard({ label, url, postId, isOwnMessage }) {
  const [postImage, setPostImage] = useState(null);
  const [postTitle, setPostTitle] = useState(label);

  useEffect(() => {
    if (!postId) return;
    fetch(`${API_BASE_URL}/api/posts/${postId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          if (data.data.image_path) setPostImage(data.data.image_path);
          if (data.data.title) setPostTitle(data.data.title);
        }
      })
      .catch(() => {});
  }, [postId]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`block w-[260px] overflow-hidden rounded-xl border transition ${
        isOwnMessage
          ? "border-white/15 bg-white/8 hover:bg-white/12"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
      }`}
    >
      <div className="h-[140px] w-full overflow-hidden bg-black/20">
        {postImage ? (
          <img src={normalizeImagePath(postImage)} alt={postTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 opacity-20"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="m7 15 3-3 2 2 3-4 3 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
          isOwnMessage ? "text-white/40" : "text-white/40"
        }`}>Shared Post</p>
        <p className={`line-clamp-2 text-sm font-semibold leading-5 ${
          isOwnMessage ? "text-white" : "text-white"
        }`}>{postTitle}</p>
      </div>
    </a>
  );
}

export default function GroupsPage() {
  const searchParams = useSearchParams();
  const urlGroupId = searchParams.get("groupId") || "";
  const urlTab = searchParams.get("tab") || "";
  const appliedUrlParamsRef = useRef(false);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const currentUserRef = useRef(null);
  const selectedGroupIdRef = useRef("");
  const activeTabRef = useRef("members");
  const membersByGroupIdRef = useRef({});
  const chatByGroupIdRef = useRef({});
  const groupTypingStopTimeoutRef = useRef(null);
  const groupTypingGroupRef = useRef("");
  const remoteGroupTypingTimeoutsRef = useRef(new Map());
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [joinRequestStatusByGroupId, setJoinRequestStatusByGroupId] = useState({});
  const [joinRequestLoadingByGroupId, setJoinRequestLoadingByGroupId] = useState({});
  const [joinRequestErrorByGroupId, setJoinRequestErrorByGroupId] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [searchInput, setSearchInput] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [groupActionError, setGroupActionError] = useState("");
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [removeMemberLoadingByUserId, setRemoveMemberLoadingByUserId] = useState({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteModalTab, setInviteModalTab] = useState("invite");
  const [inviteSearchInput, setInviteSearchInput] = useState("");
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  const [inviteLoadingByUserId, setInviteLoadingByUserId] = useState({});
  const [inviteSentByUserId, setInviteSentByUserId] = useState({});
  const [inviteError, setInviteError] = useState("");
  const [sentInvitations, setSentInvitations] = useState([]);
  const [sentInvitationsLoading, setSentInvitationsLoading] = useState(false);
  const [cancelInviteLoadingByKey, setCancelInviteLoadingByKey] = useState({});
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [createGroupTitle, setCreateGroupTitle] = useState("");
  const [createGroupDescription, setCreateGroupDescription] = useState("");
  const [createGroupAvatarFile, setCreateGroupAvatarFile] = useState(null);
  const [createGroupError, setCreateGroupError] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [groupDetailsById, setGroupDetailsById] = useState({});
  const [groupDetailsLoadingId, setGroupDetailsLoadingId] = useState("");
  const [groupDetailsErrorById, setGroupDetailsErrorById] = useState({});
  const [membersByGroupId, setMembersByGroupId] = useState({});
  const [membersLoadingByGroupId, setMembersLoadingByGroupId] = useState({});
  const [membersErrorByGroupId, setMembersErrorByGroupId] = useState({});
  const [groupJoinRequestsByGroupId, setGroupJoinRequestsByGroupId] = useState({});
  const [groupJoinRequestsLoadingByGroupId, setGroupJoinRequestsLoadingByGroupId] = useState({});
  const [groupJoinRequestsErrorByGroupId, setGroupJoinRequestsErrorByGroupId] = useState({});
  const [joinRequestActionLoadingByKey, setJoinRequestActionLoadingByKey] = useState({});
  const [postsByGroupId, setPostsByGroupId] = useState({});
  const [postsLoadingByGroupId, setPostsLoadingByGroupId] = useState({});
  const [postsErrorByGroupId, setPostsErrorByGroupId] = useState({});
  const [createGroupPostTitle, setCreateGroupPostTitle] = useState("");
  const [createGroupPostContent, setCreateGroupPostContent] = useState("");
  const [createGroupPostImageFile, setCreateGroupPostImageFile] = useState(null);
  const [isCreatingGroupPost, setIsCreatingGroupPost] = useState(false);
  const [createGroupPostError, setCreateGroupPostError] = useState("");
  const [isCreateGroupPostOpen, setIsCreateGroupPostOpen] = useState(false);
  const [chatByGroupId, setChatByGroupId] = useState({});
  const [chatLoadingByGroupId, setChatLoadingByGroupId] = useState({});
  const [chatErrorByGroupId, setChatErrorByGroupId] = useState({});
  const [typingUserIdsByGroupId, setTypingUserIdsByGroupId] = useState({});
  const [eventsByGroupId, setEventsByGroupId] = useState({});
  const [eventsLoadingByGroupId, setEventsLoadingByGroupId] = useState({});
  const [eventsErrorByGroupId, setEventsErrorByGroupId] = useState({});
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [createEventTitle, setCreateEventTitle] = useState("");
  const [createEventDescription, setCreateEventDescription] = useState("");
  const [createEventTime, setCreateEventTime] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
  const [myEventResponseByEventId, setMyEventResponseByEventId] = useState({});
  const [eventResponseLoadingByEventId, setEventResponseLoadingByEventId] = useState({});
  const [allEventResponsesByEventId, setAllEventResponsesByEventId] = useState({});
  const [attendeesModalEventId, setAttendeesModalEventId] = useState(null);
  const [isSendingGroupMessage, setIsSendingGroupMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [expandedImageUrl, setExpandedImageUrl] = useState("");
  const groupComposerRef = useRef(null);
  const groupDraftInputRef = useRef(null);
  const groupAttachmentInputRef = useRef(null);
  const groupMenuRef = useRef(null);

  function handleOpenGeneralSidebar() {
    window.dispatchEvent(new Event("app-shell:open-nav"));
  }

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
  }, [selectedGroupId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    setIsGroupMenuOpen(false);
    setGroupActionError("");
  }, [selectedGroupId]);

  useEffect(() => {
    if (!isGroupMenuOpen) return;
    function handleClickOutside(e) {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setIsGroupMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isGroupMenuOpen]);

  useEffect(() => {
    membersByGroupIdRef.current = membersByGroupId;
  }, [membersByGroupId]);

  useEffect(() => {
    chatByGroupIdRef.current = chatByGroupId;
  }, [chatByGroupId]);

  function sendGroupTypingState(groupId, isTyping) {
    const socket = socketRef.current;
    if (!groupId || !socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({
      type: "chat:group:typing",
      data: { group_id: groupId, is_typing: isTyping },
    }));
    return true;
  }

  function stopGroupTyping(groupId = groupTypingGroupRef.current) {
    if (groupTypingStopTimeoutRef.current) {
      window.clearTimeout(groupTypingStopTimeoutRef.current);
      groupTypingStopTimeoutRef.current = null;
    }
    if (groupId) sendGroupTypingState(groupId, false);
    groupTypingGroupRef.current = "";
  }

  function handleGroupDraftChange(nextValue) {
    setChatDraft(nextValue);
    const groupId = selectedGroupIdRef.current;
    if (!groupId || activeTabRef.current !== "chat") return;

    if (!nextValue.trim()) {
      stopGroupTyping(groupId);
      return;
    }

    if (groupTypingGroupRef.current && groupTypingGroupRef.current !== groupId) {
      stopGroupTyping(groupTypingGroupRef.current);
    }
    if (sendGroupTypingState(groupId, true)) groupTypingGroupRef.current = groupId;

    if (groupTypingStopTimeoutRef.current) window.clearTimeout(groupTypingStopTimeoutRef.current);
    groupTypingStopTimeoutRef.current = window.setTimeout(() => stopGroupTyping(groupId), GROUP_TYPING_IDLE_MS);
  }

  function updateRemoteGroupTyping(groupId, senderId, isTyping) {
    if (!groupId || !senderId || senderId === currentUserRef.current?.id) return;
    const timeoutKey = `${groupId}:${senderId}`;
    const existingTimeout = remoteGroupTypingTimeoutsRef.current.get(timeoutKey);
    if (existingTimeout) window.clearTimeout(existingTimeout);

    setTypingUserIdsByGroupId((current) => {
      const nextIds = new Set(current[groupId] || []);
      if (isTyping) nextIds.add(senderId);
      else nextIds.delete(senderId);
      return { ...current, [groupId]: [...nextIds] };
    });

    if (isTyping) {
      const timeoutId = window.setTimeout(() => updateRemoteGroupTyping(groupId, senderId, false), GROUP_TYPING_REMOTE_TIMEOUT_MS);
      remoteGroupTypingTimeoutsRef.current.set(timeoutKey, timeoutId);
    } else {
      remoteGroupTypingTimeoutsRef.current.delete(timeoutKey);
    }
  }

  useEffect(() => {
    const activeTypingGroup = groupTypingGroupRef.current;
    if (activeTypingGroup && (activeTypingGroup !== selectedGroupId || activeTab !== "chat")) {
      stopGroupTyping(activeTypingGroup);
    }
  }, [activeTab, selectedGroupId]);

  useEffect(() => () => {
    stopGroupTyping();
    remoteGroupTypingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    remoteGroupTypingTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadGroupsPage() {
      setIsPageLoading(true);
      setPageError("");

      try {
        const [currentUserData, joinedInbox, browseGroups, sentJoinRequests] = await Promise.all([
          getJson(`${API_BASE_URL}/api/auth/me`),
          getJson(`${API_BASE_URL}/api/chat/groups/inbox?limit=${GROUP_LIMIT}`),
          getJson(`${API_BASE_URL}/api/groups?limit=${GROUP_LIMIT}`),
          getJson(`${API_BASE_URL}/api/sent-join-requests?limit=${GROUP_LIMIT}`),
        ]);

        if (ignore) {
          return;
        }

        const joinedGroups = (joinedInbox?.conversations || []).map((group) => ({
          id: group.group_id,
          title: group.group_title,
          description: "",
          group_avatar: group.group_avatar || "",
          creator_id: group.creator_id || "",
          preview: group.last_message || "No group messages yet",
          last_activity: group.last_message_at || "",
          created_at: group.created_at || "",
          is_member: true,
        }));

        const joinedGroupIds = new Set(joinedGroups.map((group) => group.id));
        const pendingJoinRequestIds = new Set(
          (sentJoinRequests?.requests || [])
            .filter((request) => request.status === "pending")
            .map((request) => request.group_id)
        );
        const discoveredGroups = (browseGroups?.groups || []).map((group) => ({
          id: group.id,
          title: group.title,
          description: group.description || "",
          group_avatar: group.group_avatar || "",
          creator_id: group.creator_id || "",
          preview: group.description || "Browse this group",
          last_activity: group.created_at || "",
          is_member: joinedGroupIds.has(group.id),
          member_count: parseCount(getRawMemberCount(group)),
          created_at: group.created_at || "",
        }));

        const discoveredGroupById = new Map(discoveredGroups.map((group) => [group.id, group]));
        const combinedGroups = joinedGroups.map((group) => {
          const discoveredGroup = discoveredGroupById.get(group.id);
          if (!discoveredGroup) {
            return group;
          }

          return {
            ...discoveredGroup,
            ...group,
            description: group.description || discoveredGroup.description,
            group_avatar: group.group_avatar || discoveredGroup.group_avatar,
            creator_id: group.creator_id || discoveredGroup.creator_id,
            member_count: parseCount(getRawMemberCount(group)) ?? parseCount(getRawMemberCount(discoveredGroup)),
            preview: group.preview || discoveredGroup.preview,
            last_activity: group.last_activity || discoveredGroup.last_activity,
            is_member: true,
          };
        });

        discoveredGroups.forEach((group) => {
          if (!joinedGroupIds.has(group.id)) {
            combinedGroups.push(group);
          }
        });

        setCurrentUser(currentUserData || null);
        setGroups(sortGroupsByLatestActivity(combinedGroups));
        setJoinRequestStatusByGroupId(
          combinedGroups.reduce((accumulator, group) => {
            accumulator[group.id] = group.is_member ? "member" : pendingJoinRequestIds.has(group.id) ? "pending" : "idle";
            return accumulator;
          }, {})
        );
        setSelectedGroupId((currentValue) => {
          if (urlGroupId && !appliedUrlParamsRef.current) {
            const matchFound = combinedGroups.some((g) => g.id === urlGroupId);
            if (matchFound) {
              return urlGroupId;
            }
          }
          return currentValue || "";
        });

        if (urlTab && !appliedUrlParamsRef.current) {
          const validTabs = ["members", "posts", "chat", "events", "join-requests"];
          if (validTabs.includes(urlTab)) {
            setActiveTab(urlTab);
          }
        }
        appliedUrlParamsRef.current = true;
      } catch (error) {
        if (!ignore) {
          setCurrentUser(null);
          setGroups([]);
          setJoinRequestStatusByGroupId({});
          setSelectedGroupId("");
          const isUnauthorized = error?.status === 401 || /unauthorized|login/i.test(error?.message || "");
          setPageError(isUnauthorized ? "AUTH_REQUIRED" : error.message || "Failed to load groups");
        }
      } finally {
        if (!ignore) {
          setIsPageLoading(false);
        }
      }
    }

    loadGroupsPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      return undefined;
    }

    shouldReconnectRef.current = true;

    function clearReconnectTimeout() {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (!shouldReconnectRef.current || reconnectTimeoutRef.current) {
        return;
      }

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 2000);
    }

    function mergeGroupConversationSummary(summary) {
      if (!summary?.group_id) {
        return;
      }

      setGroups((currentGroups) => {
        const exists = currentGroups.some((group) => group.id === summary.group_id);
        const nextGroups = exists
          ? currentGroups.map((group) =>
              group.id === summary.group_id
                ? {
                    ...group,
                    title: group.title || summary.group_title || "Group",
                    group_avatar: group.group_avatar || summary.group_avatar || "",
                    preview: summary.last_message || "No group messages yet",
                    last_activity: summary.last_message_at || group.last_activity || "",
                    is_member: true,
                  }
                : group
            )
          : [
              {
                id: summary.group_id,
                title: summary.group_title || "Group",
                description: "",
                group_avatar: summary.group_avatar || "",
                creator_id: "",
                preview: summary.last_message || "No group messages yet",
                last_activity: summary.last_message_at || "",
                is_member: true,
              },
              ...currentGroups,
            ];

        return sortGroupsByLatestActivity(nextGroups);
      });
    }

    function appendRealtimeGroupMessage(data) {
      if (!data?.group_id || !data?.id) {
        return;
      }

      const senderId = data.sender_id || "";
      const activeGroupId = selectedGroupIdRef.current;
      const shouldCache = activeGroupId === data.group_id || Array.isArray(chatByGroupIdRef.current[data.group_id]);

      if (!shouldCache) {
        return;
      }

      const currentMembers = membersByGroupIdRef.current[data.group_id] || [];
      const senderMember = currentMembers.find((member) => member.user_id === senderId);
      const isOwnMessage = senderId && senderId === currentUserRef.current?.id;

      const nextMessage = {
        id: data.id,
        group_id: data.group_id,
        sender_id: senderId,
        nickname: isOwnMessage ? currentUserRef.current?.nickname || "You" : senderMember?.nickname || senderId,
        avatar_path: isOwnMessage ? currentUserRef.current?.avatar_path || "" : senderMember?.avatar_path || "",
        content: data.content || "",
        image_path: data.image_path || "",
        created_at: data.created_at || new Date().toISOString(),
      };

      setChatByGroupId((current) => {
        const existingMessages = current[data.group_id] || [];
        if (existingMessages.some((message) => message.id === data.id)) {
          return current;
        }

        return {
          ...current,
          [data.group_id]: [...existingMessages, nextMessage],
        };
      });
    }

    function handleSocketMessage(event) {
      let payload = null;

      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!payload?.type || payload.type === "connected") {
        return;
      }

      if (payload.type === "chat:group:conversation-updated") {
        mergeGroupConversationSummary(payload.data);
        return;
      }

      if (payload.type === "chat:group:typing") {
        updateRemoteGroupTyping(
          payload.data?.group_id,
          payload.data?.sender_id,
          Boolean(payload.data?.is_typing)
        );
        return;
      }

      if (payload.type === "chat:group:new") {
        updateRemoteGroupTyping(payload.data?.group_id, payload.data?.sender_id, false);
        appendRealtimeGroupMessage(payload.data);

        if (!payload.data?.group_id || payload.data.group_id !== selectedGroupIdRef.current || activeTabRef.current !== "chat") {
          return;
        }

        setGroups((currentGroups) =>
          sortGroupsByLatestActivity(
            currentGroups.map((group) =>
              group.id === payload.data.group_id
                ? {
                    ...group,
                    preview: payload.data.content || group.preview,
                    last_activity: payload.data.created_at || new Date().toISOString(),
                  }
                : group
            )
          )
        );
      }
    }

    function connect() {
      clearReconnectTimeout();

      if (socketRef.current) {
        socketRef.current.close();
      }

      const socket = new WebSocket(buildWebSocketUrl(API_BASE_URL));
      socketRef.current = socket;

      socket.addEventListener("message", handleSocketMessage);
      socket.addEventListener("close", () => {
        const isActiveSocket = socketRef.current === socket;

        if (isActiveSocket) {
          socketRef.current = null;
        }

        if (isActiveSocket) {
          scheduleReconnect();
        }
      });
      socket.addEventListener("error", () => {
        socket.close();
      });
    }

    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [currentUser?.id]);

  const filteredGroups = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) {
      return groups;
    }

    return groups.filter((group) => `${group.title} ${group.description} ${group.preview}`.toLowerCase().includes(query));
  }, [groups, searchInput]);

  useEffect(() => {
    if (selectedGroupId && !filteredGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId("");
    }
  }, [filteredGroups, selectedGroupId]);

  const selectedGroup = filteredGroups.find((group) => group.id === selectedGroupId) || groups.find((group) => group.id === selectedGroupId) || null;
  const selectedGroupDetails = selectedGroup?.id ? groupDetailsById[selectedGroup.id] : null;
  const selectedGroupCreatorId = selectedGroupDetails?.creator_id || selectedGroup?.creator_id || "";
  const isSelectedGroupCreator = Boolean(selectedGroup?.is_member && currentUser?.id && selectedGroupCreatorId === currentUser.id);
  const availableTabs = isSelectedGroupCreator ? [...DEFAULT_TAB_OPTIONS, { id: "requests", label: "Join Requests" }] : DEFAULT_TAB_OPTIONS;

  useEffect(() => {
    if (!selectedGroup?.id || !selectedGroup.is_member || groupDetailsById[selectedGroup.id] || groupDetailsLoadingId === selectedGroup.id) {
      return;
    }

    let ignore = false;

    async function loadGroupDetails() {
      setGroupDetailsLoadingId(selectedGroup.id);
      setGroupDetailsErrorById((current) => ({ ...current, [selectedGroup.id]: "" }));

      try {
        const data = await getJson(`${API_BASE_URL}/api/groups/${selectedGroup.id}`);
        if (!ignore) {
          setGroupDetailsById((current) => ({ ...current, [selectedGroup.id]: data }));
        }
      } catch (error) {
        if (!ignore) {
          setGroupDetailsErrorById((current) => ({ ...current, [selectedGroup.id]: error.message || "Failed to load group details" }));
        }
      } finally {
        if (!ignore) {
          setGroupDetailsLoadingId("");
        }
      }
    }

    loadGroupDetails();

    return () => {
      ignore = true;
    };
  }, [groupDetailsById, groupDetailsLoadingId, selectedGroup]);

  useEffect(() => {
    if (!selectedGroup?.id || !selectedGroup.is_member) {
      return;
    }

    async function loadActiveTab() {
      const groupId = selectedGroup.id;

      if ((activeTab === "members" || activeTab === "chat") && !membersByGroupId[groupId] && !membersLoadingByGroupId[groupId]) {
        setMembersLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
        setMembersErrorByGroupId((current) => ({ ...current, [groupId]: "" }));
        try {
          const data = await getJson(`${API_BASE_URL}/api/groups/${groupId}/members?limit=${GROUP_LIMIT}`);
          setMembersByGroupId((current) => ({ ...current, [groupId]: data?.members || [] }));
        } catch (error) {
          setMembersErrorByGroupId((current) => ({ ...current, [groupId]: error.message || "Failed to load members" }));
        } finally {
          setMembersLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
        }
      }

      if (activeTab === "requests" && isSelectedGroupCreator && !groupJoinRequestsByGroupId[groupId] && !groupJoinRequestsLoadingByGroupId[groupId]) {
        setGroupJoinRequestsLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
        setGroupJoinRequestsErrorByGroupId((current) => ({ ...current, [groupId]: "" }));
        try {
          const data = await getJson(`${API_BASE_URL}/api/groups/${groupId}/join-requests?limit=${GROUP_LIMIT}`);
          setGroupJoinRequestsByGroupId((current) => ({ ...current, [groupId]: data?.requests || [] }));
        } catch (error) {
          setGroupJoinRequestsErrorByGroupId((current) => ({ ...current, [groupId]: error.message || "Failed to load join requests" }));
        } finally {
          setGroupJoinRequestsLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
        }
      }

      if (activeTab === "posts" && !postsByGroupId[groupId] && !postsLoadingByGroupId[groupId]) {
        setPostsLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
        setPostsErrorByGroupId((current) => ({ ...current, [groupId]: "" }));
        try {
          const data = await getJson(`${API_BASE_URL}/api/groups/${groupId}/posts?limit=${GROUP_LIMIT}`);
          setPostsByGroupId((current) => ({ ...current, [groupId]: data?.posts || [] }));
        } catch (error) {
          setPostsErrorByGroupId((current) => ({ ...current, [groupId]: error.message || "Failed to load group posts" }));
        } finally {
          setPostsLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
        }
      }

      if (activeTab === "chat" && !chatByGroupId[groupId] && !chatLoadingByGroupId[groupId]) {
        setChatLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
        setChatErrorByGroupId((current) => ({ ...current, [groupId]: "" }));
        try {
          const data = await getJson(`${API_BASE_URL}/api/groups/${groupId}/chat?limit=${GROUP_LIMIT}`);
          setChatByGroupId((current) => ({ ...current, [groupId]: data?.messages || [] }));
        } catch (error) {
          setChatErrorByGroupId((current) => ({ ...current, [groupId]: error.message || "Failed to load group chat" }));
        } finally {
          setChatLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
        }
      }

      if (activeTab === "events" && !eventsByGroupId[groupId] && !eventsLoadingByGroupId[groupId]) {
        setEventsLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
        setEventsErrorByGroupId((current) => ({ ...current, [groupId]: "" }));
        try {
          const data = await getJson(`${API_BASE_URL}/api/groups/${groupId}/events?limit=${GROUP_LIMIT}`);
          const events = data?.events || [];
          setEventsByGroupId((current) => ({ ...current, [groupId]: events }));

          // Load current user's RSVP for each event in parallel
          const userId = currentUserRef.current?.id;
          if (userId && events.length > 0) {
            const responseResults = await Promise.allSettled(
              events.map((event) =>
                getJson(`${API_BASE_URL}/api/groups/${groupId}/events/${event.id}/response?limit=100`)
              )
            );
            setMyEventResponseByEventId((current) => {
              const next = { ...current };
              events.forEach((event, index) => {
                const result = responseResults[index];
                if (result.status === "fulfilled") {
                  const found = (result.value?.responses || []).find((r) => r.user_id === userId);
                  next[event.id] = found ? found.response : null;
                }
              });
              return next;
            });
            setAllEventResponsesByEventId((current) => {
              const next = { ...current };
              events.forEach((event, index) => {
                const result = responseResults[index];
                if (result.status === "fulfilled") {
                  next[event.id] = result.value?.responses || [];
                }
              });
              return next;
            });
          }
        } catch (error) {
          setEventsErrorByGroupId((current) => ({ ...current, [groupId]: error.message || "Failed to load group events" }));
        } finally {
          setEventsLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
        }
      }
    }

    loadActiveTab();
  }, [activeTab, chatByGroupId, chatLoadingByGroupId, eventsByGroupId, eventsLoadingByGroupId, groupJoinRequestsByGroupId, groupJoinRequestsLoadingByGroupId, isSelectedGroupCreator, membersByGroupId, membersLoadingByGroupId, postsByGroupId, postsLoadingByGroupId, selectedGroup]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!(groupComposerRef.current instanceof HTMLElement)) {
        return;
      }

      if (groupComposerRef.current.contains(event.target)) {
        return;
      }

      setIsEmojiPickerOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isEmojiPickerOpen]);

  function handleGroupEmojiSelect(emojiData) {
    const emoji = emojiData?.emoji || "";
    if (!emoji) {
      return;
    }

    const input = groupDraftInputRef.current;

    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      const selectionStart = input.selectionStart ?? chatDraft.length;
      const selectionEnd = input.selectionEnd ?? chatDraft.length;
      const nextValue = `${chatDraft.slice(0, selectionStart)}${emoji}${chatDraft.slice(selectionEnd)}`;
      handleGroupDraftChange(nextValue);

      window.requestAnimationFrame(() => {
        input.focus();
        const nextCursorPosition = selectionStart + emoji.length;
        input.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    } else {
      handleGroupDraftChange(`${chatDraft}${emoji}`);
    }

    setIsEmojiPickerOpen(false);
  }

  function clearGroupSelectedImage() {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImage(null);
    setSelectedImagePreviewUrl("");

    if (groupAttachmentInputRef.current) {
      groupAttachmentInputRef.current.value = "";
    }
  }

  function handleGroupAttachmentClick() {
    if (isSendingGroupMessage) {
      return;
    }

    groupAttachmentInputRef.current?.click();
  }

  function handleGroupAttachmentChange(event) {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      clearGroupSelectedImage();
      return;
    }

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImage(nextFile);
    setSelectedImagePreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleOpenExpandedImage(imagePath) {
    if (!imagePath) {
      return;
    }

    if (imagePath.startsWith("blob:")) {
      setExpandedImageUrl(imagePath);
      return;
    }

    const normalizedPath = normalizeImagePath(imagePath);
    if (!normalizedPath) {
      return;
    }

    setExpandedImageUrl(normalizedPath);
  }

  function handleCloseExpandedImage() {
    setExpandedImageUrl("");
  }

  async function handleSendGroupMessage() {
    const content = chatDraft.trim();
    if (!selectedGroup?.id || !selectedGroup.is_member || (!content && !selectedImage) || isSendingGroupMessage) {
      return;
    }

    stopGroupTyping(selectedGroup.id);
    setIsSendingGroupMessage(true);
    setChatErrorByGroupId((current) => ({ ...current, [selectedGroup.id]: "" }));

    try {
      let result;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("content", content);
        formData.append("image_path", selectedImage);

        result = await getJson(`${API_BASE_URL}/api/groups/${selectedGroup.id}/chat`, {
          method: "POST",
          body: formData,
        });
      } else {
        result = await getJson(`${API_BASE_URL}/api/groups/${selectedGroup.id}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });
      }

      const optimisticMessage = {
        id: result?.message_id || `local-${Date.now()}`,
        group_id: selectedGroup.id,
        sender_id: currentUser?.id || "",
        nickname: currentUser?.nickname || "You",
        avatar_path: currentUser?.avatar_path || "",
        content,
        image_path: selectedImagePreviewUrl || "",
        created_at: new Date().toISOString(),
      };

      setChatByGroupId((current) => ({
        ...current,
        [selectedGroup.id]: (current[selectedGroup.id] || []).some((message) => message.id === optimisticMessage.id)
          ? current[selectedGroup.id] || []
          : [...(current[selectedGroup.id] || []), optimisticMessage],
      }));
      setGroups((currentGroups) =>
        sortGroupsByLatestActivity(
          currentGroups.map((group) =>
            group.id === selectedGroup.id
              ? {
                  ...group,
                  preview: content,
                  last_activity: optimisticMessage.created_at,
                  is_member: true,
                }
              : group
          )
        )
      );
      setChatDraft("");
      clearGroupSelectedImage();
    } catch (error) {
      setChatErrorByGroupId((current) => ({ ...current, [selectedGroup.id]: error.message || "Failed to send group message" }));
    } finally {
      setIsSendingGroupMessage(false);
    }
  }

  async function handleCreateGroupPost() {
    const groupId = selectedGroup?.id;
    if (!groupId) return;

    const title = createGroupPostTitle.trim();
    const content = createGroupPostContent.trim();

    if (!title || !content) {
      setCreateGroupPostError("Title and content are required");
      return;
    }
    if (isCreatingGroupPost) return;

    setIsCreatingGroupPost(true);
    setCreateGroupPostError("");

    try {
      let payload;
      if (createGroupPostImageFile) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("image_path", createGroupPostImageFile);
        payload = await getJson(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
          method: "POST",
          body: formData,
        });
      } else {
        payload = await getJson(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
      }

      const newPost = {
        id: payload?.post_id || crypto.randomUUID(),
        group_id: groupId,
        user_id: currentUser?.id || "",
        title,
        content,
        image_path: createGroupPostImageFile ? URL.createObjectURL(createGroupPostImageFile) : "",
        nickname: currentUser?.nickname || currentUser?.id || "",
        avatar_path: currentUser?.avatar_path || "",
        created_at: new Date().toISOString(),
      };

      setPostsByGroupId((current) => ({
        ...current,
        [groupId]: [newPost, ...(current[groupId] || [])],
      }));
      setIsCreateGroupPostOpen(false);
      setCreateGroupPostTitle("");
      setCreateGroupPostContent("");
      setCreateGroupPostImageFile(null);

      // Refetch the posts list in the background so the real server image_path replaces the blob URL
      try {
        const refreshed = await getJson(`${API_BASE_URL}/api/groups/${groupId}/posts?limit=${GROUP_LIMIT}`);
        setPostsByGroupId((current) => ({ ...current, [groupId]: refreshed?.posts || [] }));
      } catch {
        // Non-critical — the optimistic post is already visible
      }
    } catch (error) {
      setCreateGroupPostError(error.message || "Failed to create post");
    } finally {
      setIsCreatingGroupPost(false);
    }
  }

  async function handleCreateGroup() {
    const title = createGroupTitle.trim();
    const description = createGroupDescription.trim();

    if (!title || !description || isCreatingGroup) {
      setCreateGroupError(!title || !description ? "Title and description are required" : "");
      return;
    }

    setIsCreatingGroup(true);
    setCreateGroupError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (createGroupAvatarFile) {
        formData.append("avatar", createGroupAvatarFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || "Failed to create group");
      }

      const groupId = payload?.data?.group_id;
      if (!groupId) {
        throw new Error("Created group id was not returned");
      }

      let details = null;
      try {
        details = await getJson(`${API_BASE_URL}/api/groups/${groupId}`);
      } catch {
        details = null;
      }

      const newGroup = {
        id: groupId,
        title,
        description,
        group_avatar: details?.group_avatar || "",
        creator_id: currentUser?.id || details?.creator_id || "",
        preview: description,
        last_activity: details?.created_at || new Date().toISOString(),
        is_member: true,
      };

      setGroups((currentGroups) => {
        const nextGroups = [newGroup, ...currentGroups.filter((group) => group.id !== groupId)];
        return nextGroups;
      });
      setJoinRequestStatusByGroupId((current) => ({ ...current, [groupId]: "member" }));
      if (details) {
        setGroupDetailsById((current) => ({ ...current, [groupId]: details }));
      }
      setSelectedGroupId(groupId);
      setActiveTab("members");
      setSearchInput("");
      setIsCreateGroupOpen(false);
      setCreateGroupTitle("");
      setCreateGroupDescription("");
      setCreateGroupAvatarFile(null);
    } catch (error) {
      setCreateGroupError(error.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleLoadSentInvitations() {
    const groupId = selectedGroup?.id;
    if (!groupId) return;
    setSentInvitationsLoading(true);
    try {
      const data = await getJson(`${API_BASE_URL}/api/sent-invitations?limit=50`);
      const all = data?.invitations || [];
      setSentInvitations(all.filter((inv) => inv.group_id === groupId));
    } catch {
      setSentInvitations([]);
    } finally {
      setSentInvitationsLoading(false);
    }
  }

  async function handleCancelInvitation(groupId, userId) {
    const key = `${groupId}:${userId}`;
    if (cancelInviteLoadingByKey[key]) return;
    setCancelInviteLoadingByKey((c) => ({ ...c, [key]: true }));
    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/invitations/${userId}`, { method: "DELETE" });
      setSentInvitations((current) => current.filter((inv) => inv.invitee_id !== userId));
      setInviteSentByUserId((c) => { const next = { ...c }; delete next[userId]; return next; });
    } catch (error) {
      setInviteError(error.message || "Failed to cancel invitation");
    } finally {
      setCancelInviteLoadingByKey((c) => ({ ...c, [key]: false }));
    }
  }

  async function handleInviteSearch(query) {
    if (!query.trim()) {
      setInviteSearchResults([]);
      return;
    }
    setInviteSearchLoading(true);
    try {
      const data = await getJson(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query.trim())}&limit=20`);
      setInviteSearchResults(data?.users || []);
    } catch {
      setInviteSearchResults([]);
    } finally {
      setInviteSearchLoading(false);
    }
  }

  async function handleSendInvitation(userId) {
    const groupId = selectedGroup?.id;
    if (!groupId || !userId || inviteLoadingByUserId[userId]) return;
    setInviteLoadingByUserId((c) => ({ ...c, [userId]: true }));
    setInviteError("");
    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/invitations/${userId}`, { method: "POST" });
      setInviteSentByUserId((c) => ({ ...c, [userId]: true }));
    } catch (error) {
      setInviteError(error.message || "Failed to send invitation");
    } finally {
      setInviteLoadingByUserId((c) => ({ ...c, [userId]: false }));
    }
  }

  async function handleLeaveGroup() {
    if (!selectedGroup?.id || isLeavingGroup) return;
    const shouldLeave = window.confirm(`Leave the group "${selectedGroup.title}"?`);
    if (!shouldLeave) return;

    setIsLeavingGroup(true);
    setGroupActionError("");

    try {
      await getJson(`${API_BASE_URL}/api/groups/${selectedGroup.id}/leave`, { method: "DELETE" });
      const leftGroupId = selectedGroup.id;
      setGroups((current) => current.filter((g) => g.id !== leftGroupId));
      setSelectedGroupId("");
      setActiveTab("members");
    } catch (error) {
      setGroupActionError(error.message || "Failed to leave group");
    } finally {
      setIsLeavingGroup(false);
    }
  }

  async function handleRemoveMember(groupId, userId) {
    if (!groupId || !userId || removeMemberLoadingByUserId[userId]) return;
    const member = (membersByGroupId[groupId] || []).find((m) => m.user_id === userId);
    const name = member?.nickname || "this member";
    const shouldRemove = window.confirm(`Remove ${name} from the group?`);
    if (!shouldRemove) return;

    setRemoveMemberLoadingByUserId((current) => ({ ...current, [userId]: true }));

    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      setMembersByGroupId((current) => ({
        ...current,
        [groupId]: (current[groupId] || []).filter((m) => m.user_id !== userId),
      }));
    } catch (error) {
      setGroupActionError(error.message || "Failed to remove member");
    } finally {
      setRemoveMemberLoadingByUserId((current) => ({ ...current, [userId]: false }));
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroup?.id || !isSelectedGroupCreator || isDeletingGroup) {
      return;
    }

    const shouldDelete = window.confirm(`Delete the group "${selectedGroup.title}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    setIsDeletingGroup(true);
    setGroupActionError("");

    try {
      await getJson(`${API_BASE_URL}/api/groups/${selectedGroup.id}`, {
        method: "DELETE",
      });

      const deletedGroupId = selectedGroup.id;
      setGroups((currentGroups) => currentGroups.filter((group) => group.id !== deletedGroupId));
      setJoinRequestStatusByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setGroupDetailsById((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setMembersByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setPostsByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setChatByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setEventsByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setGroupJoinRequestsByGroupId((current) => {
        const next = { ...current };
        delete next[deletedGroupId];
        return next;
      });
      setSelectedGroupId((currentSelectedGroupId) => (currentSelectedGroupId === deletedGroupId ? "" : currentSelectedGroupId));
      setActiveTab("members");
      setIsGroupMenuOpen(false);
    } catch (error) {
      setGroupActionError(error.message || "Failed to delete group");
    } finally {
      setIsDeletingGroup(false);
    }
  }

  async function handleCreateEvent() {
    const groupId = selectedGroup?.id;
    if (!groupId) return;

    const title = createEventTitle.trim();
    const description = createEventDescription.trim();
    const eventTime = createEventTime.trim();

    if (!title || !description || !eventTime) {
      setCreateEventError("Title, description, and date/time are required");
      return;
    }
    if (isCreatingEvent) return;

    setIsCreatingEvent(true);
    setCreateEventError("");

    try {
      const payload = await getJson(`${API_BASE_URL}/api/groups/${groupId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, event_time: eventTime }),
      });

      const eventId = payload?.event_id;
      const newEvent = {
        id: eventId || crypto.randomUUID(),
        group_id: groupId,
        creator_id: currentUser?.id || "",
        title,
        description,
        event_time: new Date(eventTime).toISOString(),
        created_at: new Date().toISOString(),
      };

      setEventsByGroupId((current) => ({
        ...current,
        [groupId]: [newEvent, ...(current[groupId] || [])],
      }));
      setIsCreateEventOpen(false);
      setCreateEventTitle("");
      setCreateEventDescription("");
      setCreateEventTime("");
    } catch (error) {
      setCreateEventError(error.message || "Failed to create event");
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleCancelEvent(groupId, eventId) {
    if (!groupId || !eventId) return;

    const shouldCancel = window.confirm("Cancel this event? This cannot be undone.");
    if (!shouldCancel) return;

    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/events/${eventId}`, {
        method: "DELETE",
      });
      setEventsByGroupId((current) => ({
        ...current,
        [groupId]: (current[groupId] || []).filter((e) => e.id !== eventId),
      }));
    } catch (error) {
      alert(error.message || "Failed to cancel event");
    }
  }

  async function handleEventRSVP(groupId, eventId, response) {
    if (!groupId || !eventId || !response) return;

    const previous = myEventResponseByEventId[eventId] ?? null;
    setMyEventResponseByEventId((current) => ({ ...current, [eventId]: response }));
    setEventResponseLoadingByEventId((current) => ({ ...current, [eventId]: true }));

    if (currentUser?.id) {
      setAllEventResponsesByEventId((current) => {
        const existing = current[eventId] || [];
        const without = existing.filter((r) => r.user_id !== currentUser.id);
        return {
          ...current,
          [eventId]: [...without, { user_id: currentUser.id, nickname: currentUser.nickname || currentUser.id, avatar_path: currentUser.avatar_path || "", response }],
        };
      });
    }

    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/events/${eventId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
    } catch (error) {
      setMyEventResponseByEventId((current) => ({ ...current, [eventId]: previous }));
      if (currentUser?.id) {
        setAllEventResponsesByEventId((current) => {
          const existing = current[eventId] || [];
          const without = existing.filter((r) => r.user_id !== currentUser.id);
          const reverted = previous
            ? [...without, { user_id: currentUser.id, nickname: currentUser.nickname || currentUser.id, avatar_path: currentUser.avatar_path || "", response: previous }]
            : without;
          return { ...current, [eventId]: reverted };
        });
      }
      alert(error.message || "Failed to save RSVP");
    } finally {
      setEventResponseLoadingByEventId((current) => ({ ...current, [eventId]: false }));
    }
  }

  async function handleJoinRequestAction(groupId) {
    const status = joinRequestStatusByGroupId[groupId] || "idle";
    if (!groupId || status === "member" || joinRequestLoadingByGroupId[groupId]) {
      return;
    }

    const isCancelling = status === "pending";

    setJoinRequestLoadingByGroupId((current) => ({ ...current, [groupId]: true }));
    setJoinRequestErrorByGroupId((current) => ({ ...current, [groupId]: "" }));

    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/join-requests`, {
        method: isCancelling ? "DELETE" : "POST",
      });

      setJoinRequestStatusByGroupId((current) => ({
        ...current,
        [groupId]: isCancelling ? "idle" : "pending",
      }));
    } catch (error) {
      setJoinRequestErrorByGroupId((current) => ({
        ...current,
        [groupId]: error.message || (isCancelling ? "Failed to cancel request" : "Failed to send request"),
      }));
    } finally {
      setJoinRequestLoadingByGroupId((current) => ({ ...current, [groupId]: false }));
    }
  }

  async function handleCreatorJoinRequestResponse(groupId, userId, action) {
    const requestKey = `${groupId}:${userId}:${action}`;
    if (!groupId || !userId || joinRequestActionLoadingByKey[requestKey]) {
      return;
    }

    setJoinRequestActionLoadingByKey((current) => ({ ...current, [requestKey]: true }));
    setGroupJoinRequestsErrorByGroupId((current) => ({ ...current, [groupId]: "" }));

    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/join-requests/${userId}/${action}`, {
        method: "POST",
      });

      setGroupJoinRequestsByGroupId((current) => ({
        ...current,
        [groupId]: (current[groupId] || []).filter((request) => request.requester_id !== userId),
      }));

      if (action === "accept") {
        setMembersByGroupId((current) => {
          const members = current[groupId];
          if (!members) {
            return current;
          }

          const existingMember = members.some((member) => member.user_id === userId);
          if (existingMember) {
            return current;
          }

          const acceptedRequest = (groupJoinRequestsByGroupId[groupId] || []).find((request) => request.requester_id === userId);
          if (!acceptedRequest) {
            return current;
          }

          return {
            ...current,
            [groupId]: [
              ...members,
              {
                user_id: acceptedRequest.requester_id,
                nickname: acceptedRequest.requester_nickname,
                avatar_path: acceptedRequest.avatar_path,
                role: "member",
              },
            ],
          };
        });

        setGroupDetailsById((current) => {
          const details = current[groupId];
          if (!details) {
            return current;
          }

          return {
            ...current,
            [groupId]: {
              ...details,
              member_count: (details.member_count || 0) + 1,
            },
          };
        });
      }
    } catch (error) {
      setGroupJoinRequestsErrorByGroupId((current) => ({
        ...current,
        [groupId]: error.message || `Failed to ${action} join request`,
      }));
    } finally {
      setJoinRequestActionLoadingByKey((current) => {
        const next = { ...current };
        delete next[requestKey];
        return next;
      });
    }
  }

  function renderMembersTab() {
    if (!selectedGroup) {
      return null;
    }

    if (membersLoadingByGroupId[selectedGroup.id]) {
      return <LoadingState label="Loading group members..." />;
    }

    if (membersErrorByGroupId[selectedGroup.id]) {
      return <EmptyState title="Members unavailable" description={membersErrorByGroupId[selectedGroup.id]} />;
    }

    const members = membersByGroupId[selectedGroup.id] || [];
    if (!members.length) {
      return <EmptyState title="No members found" description="This group does not have visible members yet." />;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {selectedGroup.is_member ? (
            <button
              type="button"
              onClick={() => {
                setInviteSearchInput("");
                setInviteSearchResults([]);
                setInviteSentByUserId({});
                setInviteError("");
                setInviteModalTab("invite");
                setSentInvitations([]);
                setIsInviteModalOpen(true);
              }}
              className="rounded-full bg-[#fe2c55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
            >
              + Invite Member
            </button>
          ) : <div />}
          {!isSelectedGroupCreator ? (
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={isLeavingGroup}
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLeavingGroup ? "Leaving..." : "Leave Group"}
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div key={member.user_id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <UserAvatar avatarPath={member.avatar_path} label={member.nickname || member.user_id} status={member.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{member.nickname || member.user_id}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/38">{member.role}</p>
                </div>
                {isSelectedGroupCreator && member.user_id !== currentUser?.id ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(selectedGroup.id, member.user_id)}
                    disabled={Boolean(removeMemberLoadingByUserId[member.user_id])}
                    className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/55 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removeMemberLoadingByUserId[member.user_id] ? "..." : "Remove"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderPostsTab() {
    if (!selectedGroup) {
      return null;
    }

    if (postsLoadingByGroupId[selectedGroup.id]) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-white/45">Loading group posts...</p>
        </div>
      );
    }

    if (postsErrorByGroupId[selectedGroup.id]) {
      return (
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-white/45">{postsErrorByGroupId[selectedGroup.id]}</p>
        </div>
      );
    }

    const posts = postsByGroupId[selectedGroup.id] || [];

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-3">
          <p className="text-sm text-white/45">
            {posts.length === 0 ? "No posts yet" : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
          </p>
          <button
            type="button"
            onClick={() => {
              setCreateGroupPostError("");
              setCreateGroupPostTitle("");
              setCreateGroupPostContent("");
              setCreateGroupPostImageFile(null);
              setIsCreateGroupPostOpen(true);
            }}
            className="rounded-full bg-[#fe2c55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
          >
            + Create Post
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-lg font-semibold text-white">No group posts yet</p>
              <p className="mt-2 text-sm text-white/45">When members publish posts in this group, they will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {posts.map((post) => (
              <div key={post.id} className="snap-start flex h-full items-center justify-center p-4 sm:p-8">
                {post.image_path ? (
                  <article className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-[#101010] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="relative">
                      <img
                        src={normalizeImagePath(post.image_path)}
                        alt={post.title}
                        className="max-h-[56vh] w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-4">
                        <div className="flex items-center gap-3">
                  <UserAvatar avatarPath={post.avatar_path} label={post.nickname || post.user_id} status={post.status} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{post.nickname || post.user_id}</p>
                            <p className="text-xs text-white/55">{formatLongDate(post.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-4">
                      {post.title ? <h3 className="text-base font-semibold text-white">{post.title}</h3> : null}
                      {post.content ? <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/62">{post.content}</p> : null}
                    </div>
                  </article>
                ) : (
                  <article className="relative flex h-full w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(254,44,85,0.24),transparent_40%),radial-gradient(circle_at_bottom,rgba(37,244,238,0.10),transparent_35%),#0e0e0e] px-8 py-20 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="mx-auto w-full max-w-[34rem]">
                      {post.title ? <p className="mb-5 text-xs font-semibold uppercase tracking-[0.26em] text-white/35">{post.title}</p> : null}
                      {post.content ? <p className="whitespace-pre-wrap text-xl leading-9 text-white/90">{post.content}</p> : null}
                    </div>
                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                      <UserAvatar avatarPath={post.avatar_path} label={post.nickname || post.user_id} status={post.status} />
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-semibold text-white">{post.nickname || post.user_id}</p>
                        <p className="text-xs text-white/40">{formatLongDate(post.created_at)}</p>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderChatTab() {
    if (!selectedGroup) {
      return null;
    }

    if (chatLoadingByGroupId[selectedGroup.id]) {
      return <LoadingState label="Loading group chat..." />;
    }

    const messages = chatByGroupId[selectedGroup.id] || [];
    const members = membersByGroupId[selectedGroup.id] || [];
    const typingUsers = (typingUserIdsByGroupId[selectedGroup.id] || []).map((userId) => {
      const member = members.find((item) => item.user_id === userId);
      return {
        user_id: userId,
        nickname: member?.nickname || `User ${userId.slice(0, 6)}`,
        avatar_path: member?.avatar_path || "",
      };
    });

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-black">
        <div className="theme-scrollbar flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="flex min-h-full w-full flex-col justify-end gap-6">
          {chatErrorByGroupId[selectedGroup.id] ? (
            <div className="rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">
              {chatErrorByGroupId[selectedGroup.id]}
            </div>
          ) : null}
          {messages.length ? (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUser?.id;

                return (
                  <div key={message.id} className={`flex items-end gap-2.5 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage ? (
                      <ChatAvatar avatarPath={message.avatar_path} label={message.nickname || message.sender_id} />
                    ) : null}
                    <div className={`max-w-[min(78vw,380px)] rounded-2xl border px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.3)] ${isOwnMessage ? "rounded-br-md border-[#fe2c55]/25 bg-[#fe2c55]/18 text-white" : "rounded-bl-md border-white/10 bg-[#181818] text-white"}`}>
                      {!isOwnMessage ? (
                        <p className="mb-1.5 text-xs font-semibold text-[#ff7893]">{message.nickname || message.sender_id}</p>
                      ) : null}
                      {parseSharedPost(message.content)
                        ? <SharedPostCard label={parseSharedPost(message.content).label} url={parseSharedPost(message.content).url} postId={parseSharedPost(message.content).postId} isOwnMessage={isOwnMessage} />
                        : parseSharedProfile(message.content)
                          ? <SharedProfileCard label={parseSharedProfile(message.content).label} url={parseSharedProfile(message.content).url} userId={parseSharedProfile(message.content).userId} isOwnMessage={isOwnMessage} />
                          : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                      {message.image_path ? (
                        <button
                          type="button"
                          onClick={() => handleOpenExpandedImage(message.image_path)}
                          className="mt-2 block w-full overflow-hidden rounded-xl focus:outline-none"
                          aria-label="Open image preview"
                        >
                          <img
                            src={message.image_path.startsWith("blob:") ? message.image_path : normalizeImagePath(message.image_path)}
                            alt="Shared image"
                            className="max-h-[220px] w-full rounded-xl object-cover transition hover:opacity-90"
                          />
                        </button>
                      ) : null}
                      <p className="mt-1.5 text-right text-[11px] text-white/38">
                        {formatRelativeDate(message.created_at)}
                      </p>
                    </div>
                    {isOwnMessage ? (
                      <ChatAvatar avatarPath={currentUser?.avatar_path} label={currentUser?.nickname || "You"} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : !typingUsers.length ? (
            <div className="flex flex-1 items-center justify-center">
              <MessageOutlineIcon />
            </div>
          ) : null}
          {typingUsers.length ? (
            <div className="flex items-end gap-2.5 pt-1">
              <div className="flex -space-x-2">
                {typingUsers.slice(0, 3).map((user) => (
                  <ChatAvatar key={user.user_id} avatarPath={user.avatar_path} label={user.nickname} />
                ))}
              </div>
              <div className="rounded-2xl rounded-bl-md border border-white/10 bg-[#181818] px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
                <p className="mb-1 text-xs text-white/48">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].nickname} is typing`
                    : `${typingUsers.slice(0, 2).map((user) => user.nickname).join(" and ")}${typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : ""} are typing`}
                </p>
                <GroupTypingDots />
              </div>
            </div>
          ) : null}
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-4 sm:px-8">
          <div ref={groupComposerRef} className="relative">
            {isEmojiPickerOpen ? (
              <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 w-[272px] rounded-[24px] border border-white/10 bg-[#131313] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] min-[500px]:right-12 min-[500px]:w-[360px] sm:w-[390px]">
                <EmojiPicker
                  onEmojiClick={handleGroupEmojiSelect}
                  theme="dark"
                  lazyLoadEmojis
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{ showPreview: false }}
                  width="100%"
                  height={460}
                />
              </div>
            ) : null}
            <div className="flex w-full flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-3">
              {selectedImage ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {selectedImagePreviewUrl ? (
                      <img
                        src={selectedImagePreviewUrl}
                        alt={selectedImage.name || "Selected image"}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{selectedImage.name}</p>
                      <p className="text-xs text-white/45">Image ready to send</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearGroupSelectedImage}
                    disabled={isSendingGroupMessage}
                    className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <div className="flex w-full items-center gap-3">
                <input
                  ref={groupAttachmentInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={handleGroupAttachmentChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleGroupAttachmentClick}
                  disabled={isSendingGroupMessage}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Attach image"
                >
                  <ImageIcon />
                </button>
                <input
                  ref={groupDraftInputRef}
                  type="text"
                  value={chatDraft}
                  onChange={(event) => handleGroupDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendGroupMessage();
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                />
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((current) => !current)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Open emoji picker"
                >
                  <SmileIcon />
                </button>
                <button
                  type="button"
                  onClick={handleSendGroupMessage}
                  disabled={isSendingGroupMessage || (!chatDraft.trim() && !selectedImage)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fe2c55] text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  {isSendingGroupMessage ? "..." : <SendIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderEventsTab() {
    if (!selectedGroup) {
      return null;
    }

    if (eventsLoadingByGroupId[selectedGroup.id]) {
      return <LoadingState label="Loading group events..." />;
    }

    if (eventsErrorByGroupId[selectedGroup.id]) {
      return <EmptyState title="Events unavailable" description={eventsErrorByGroupId[selectedGroup.id]} />;
    }

    const events = eventsByGroupId[selectedGroup.id] || [];

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">{events.length === 0 ? "No upcoming events" : `${events.length} event${events.length === 1 ? "" : "s"}`}</p>
          <button
            type="button"
            onClick={() => {
              setCreateEventError("");
              setCreateEventTitle("");
              setCreateEventDescription("");
              setCreateEventTime("");
              setIsCreateEventOpen(true);
            }}
            className="rounded-full bg-[#fe2c55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
          >
            + Create Event
          </button>
        </div>

        {events.length === 0 ? (
          <EmptyState title="No upcoming events" description="Group events will appear here once members start planning them." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {events.map((event) => {
              const isCreator = currentUser?.id === event.creator_id;
              const myResponse = myEventResponseByEventId[event.id] ?? null;
              const isRsvpLoading = Boolean(eventResponseLoadingByEventId[event.id]);

              return (
                <article key={event.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#fe8ea4]">{formatLongDate(event.event_time)}</p>
                    {isCreator ? (
                      <button
                        type="button"
                        onClick={() => handleCancelEvent(selectedGroup.id, event.id)}
                        className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/50 transition hover:border-[#fe2c55]/40 hover:text-[#fe2c55]"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{event.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{event.description}</p>
                  <p className="mt-4 text-xs text-white/35">Created {formatLongDate(event.created_at)}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isRsvpLoading}
                      onClick={() => handleEventRSVP(selectedGroup.id, event.id, "going")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        myResponse === "going"
                          ? "bg-[#fe2c55] text-white"
                          : "border border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                      }`}
                    >
                      Going
                    </button>
                    <button
                      type="button"
                      disabled={isRsvpLoading}
                      onClick={() => handleEventRSVP(selectedGroup.id, event.id, "not_going")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        myResponse === "not_going"
                          ? "bg-[#fe2c55] text-white"
                          : "border border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                      }`}
                    >
                      Not Going
                    </button>
                    {isCreator ? (
                      <button
                        type="button"
                        onClick={() => setAttendeesModalEventId(event.id)}
                        className="ml-auto rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        View Attendees
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderJoinRequestsTab() {
    if (!selectedGroup) {
      return null;
    }

    if (!isSelectedGroupCreator) {
      return <EmptyState title="Creator only" description="Only the group creator can review pending join requests." />;
    }

    if (groupJoinRequestsLoadingByGroupId[selectedGroup.id]) {
      return <LoadingState label="Loading join requests..." />;
    }

    if (groupJoinRequestsErrorByGroupId[selectedGroup.id]) {
      return <EmptyState title="Join requests unavailable" description={groupJoinRequestsErrorByGroupId[selectedGroup.id]} />;
    }

    const requests = groupJoinRequestsByGroupId[selectedGroup.id] || [];
    if (!requests.length) {
      return <EmptyState title="No pending requests" description="New join requests will appear here for the group creator to review." />;
    }

    return (
      <div className="space-y-4">
        {requests.map((request) => {
          const acceptKey = `${selectedGroup.id}:${request.requester_id}:accept`;
          const rejectKey = `${selectedGroup.id}:${request.requester_id}:reject`;
          const isAccepting = Boolean(joinRequestActionLoadingByKey[acceptKey]);
          const isRejecting = Boolean(joinRequestActionLoadingByKey[rejectKey]);
          const isProcessing = isAccepting || isRejecting;

          return (
            <article key={request.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar avatarPath={request.avatar_path} label={request.requester_nickname || request.requester_id} status={request.requester_status} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{request.requester_nickname || request.requester_id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/38">Requested {formatLongDate(request.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreatorJoinRequestResponse(selectedGroup.id, request.requester_id, "reject")}
                    disabled={isProcessing}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRejecting ? "Rejecting..." : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreatorJoinRequestResponse(selectedGroup.id, request.requester_id, "accept")}
                    disabled={isProcessing}
                    className="rounded-full bg-[#fe2c55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAccepting ? "Accepting..." : "Accept"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderTabPanel() {
    if (!selectedGroup) {
      return <EmptyState title="Choose a group" description="Select a group from the left side to explore members, posts, group chat, and events." />;
    }

    if (!selectedGroup.is_member) {
      return <EmptyState title="Members-only sections" description="This group appears in the browse list, but its members, posts, chat, and events are only available after you join the group." />;
    }

    if (activeTab === "members") {
      return renderMembersTab();
    }
    if (activeTab === "posts") {
      return renderPostsTab();
    }
    if (activeTab === "chat") {
      return renderChatTab();
    }
    if (activeTab === "requests") {
      return renderJoinRequestsTab();
    }

    return renderEventsTab();
  }

  function getGroupMemberCount(group) {
    if (!group?.id) {
      return null;
    }

    const detailedCount = parseCount(getRawMemberCount(groupDetailsById[group.id]));
    if (detailedCount !== null) {
      return detailedCount;
    }

    const cachedMembers = membersByGroupId[group.id];
    if (Array.isArray(cachedMembers)) {
      return cachedMembers.length;
    }

    const groupCount = parseCount(getRawMemberCount(group));
    if (groupCount !== null) {
      return groupCount;
    }

    return null;
  }

  function renderGroupListPage() {
    return (
      <div className="flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenGeneralSidebar}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white min-[1200px]:hidden"
                  aria-label="Open general navigation"
                >
                  <MenuIcon />
                </button>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.35em] text-white/40">Community</span>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Groups</h1>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-3">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search groups"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateGroupError("");
                  setIsCreateGroupOpen(true);
                }}
                className="shrink-0 rounded-full bg-[#fe2c55] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#e0264b]"
              >
                Create Group
              </button>
            </div>
          </div>
        </section>

        {pageError === "AUTH_REQUIRED" ? (
          <LoginRequiredState
            title="Log in to view groups"
            description="Groups are available after you sign in. Log in to browse communities, join discussions, and manage your requests."
          />
        ) : pageError ? (
          <section className="rounded-[26px] border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-5 py-4 text-sm text-[#ffd6df]">
            {pageError}
          </section>
        ) : null}

        {pageError ? null : isPageLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
            ))}
          </section>
        ) : filteredGroups.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredGroups.map((group) => {
              const groupMemberCount = getGroupMemberCount(group);
              const createdLabel = formatCreatedDate(group.created_at || group.last_activity);
              const joinRequestStatus = joinRequestStatusByGroupId[group.id] || (group.is_member ? "member" : "idle");
              const isJoinRequestLoading = Boolean(joinRequestLoadingByGroupId[group.id]);
              const joinRequestError = joinRequestErrorByGroupId[group.id] || "";
              const joinRequestButtonLabel = isJoinRequestLoading
                ? joinRequestStatus === "pending"
                  ? "Cancelling..."
                  : "Sending..."
                : joinRequestStatus === "pending"
                  ? "Requested"
                  : "Join Request";

              return (
                <article
                  key={group.id}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#111111]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setActiveTab("members");
                    }}
                    className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center"
                  >
                    <div className={`flex w-full items-start gap-3 ${group.is_member ? "justify-between" : "justify-end"}`}>
                      {group.is_member ? (
                        <span className="rounded-full bg-[#fe2c55]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffc1cf]">
                          Joined
                        </span>
                      ) : null}
                      {createdLabel ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                          <CalendarIcon />
                          {createdLabel}
                        </span>
                      ) : null}
                    </div>
                    <GroupAvatar avatarPath={group.group_avatar} label={group.title} sizeClassName="h-24 w-24 text-2xl" />
                    <div className="w-full min-w-0">
                      <h2 className="truncate text-base font-semibold text-white">{group.title}</h2>
                      <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-white/50">
                        {group.description || group.preview || "Browse this group"}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4">
                      {groupMemberCount !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                          <MemberIcon />
                          {formatMemberCount(groupMemberCount)}
                        </span>
                      ) : null}
                    </div>
                  </button>

                  {!group.is_member ? (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() => handleJoinRequestAction(group.id)}
                        disabled={isJoinRequestLoading}
                        className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${joinRequestStatus === "pending" ? "border border-white/12 bg-white/[0.05] text-white/78 hover:bg-white/[0.1]" : "bg-[#fe2c55] text-white hover:bg-[#e0264b]"} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {joinRequestButtonLabel}
                      </button>
                      {joinRequestError ? <p className="mt-3 text-center text-xs text-[#ff9db2]">{joinRequestError}</p> : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-white">No groups found</h2>
            <p className="mt-2 text-sm text-white/50">
              {searchInput.trim() ? "Try a different search term." : "There are no groups to show yet."}
            </p>
          </section>
        )}
      </div>
    );
  }

  const headerTitle = selectedGroupDetails?.title || selectedGroup?.title || "Groups";
  const headerDescription = selectedGroupDetails?.description || selectedGroup?.description || "Browse your joined groups and community activity.";
  const headerAvatar = selectedGroupDetails?.group_avatar || selectedGroup?.group_avatar || "";
  const memberCount = getGroupMemberCount(selectedGroup);

  return (
    <main className={`${selectedGroup ? "h-dvh overflow-hidden" : "min-h-screen overflow-x-hidden"} bg-[radial-gradient(circle_at_top,#171717_0%,#060606_48%,#020202_100%)] text-white ${selectedGroup ? "px-0 py-0" : "px-4 pb-16 pt-20 min-[1200px]:pl-[288px] min-[1200px]:pr-8 min-[1200px]:pt-8"}`}>
      {selectedGroup ? (
        <section className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]">
              <div className="shrink-0 border-b border-white/10 bg-[linear-gradient(180deg,#111_0%,#070707_100%)] px-4 py-4 sm:px-8 sm:py-6">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupId("")}
                        className="ml-12 flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white min-[1200px]:ml-0"
                        aria-label="Back to groups"
                      >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                          <path d="M14.5 6.5 9 12l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="hidden min-[420px]:inline">Groups</span>
                      </button>
                      <GroupAvatar avatarPath={headerAvatar} label={headerTitle} sizeClassName="h-14 w-14 text-base" />
                      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 text-xl font-semibold leading-tight text-white sm:text-2xl">{headerTitle}</p>
                          {memberCount !== null ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                              <MemberIcon />
                              {formatMemberCount(memberCount)}
                            </span>
                          ) : null}
                          {selectedGroupDetails?.created_at || selectedGroup?.created_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                              <CalendarIcon />
                              {formatCreatedDate(selectedGroupDetails?.created_at || selectedGroup?.created_at)}
                            </span>
                          ) : null}
                        </div>
                        <div className="max-h-20 max-w-3xl overflow-y-auto break-words text-sm leading-6 text-white/48 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {headerDescription}
                        </div>
                      </div>
                    </div>

                    <div className="relative flex shrink-0 items-center gap-3 max-sm:hidden">
                      {isSelectedGroupCreator ? (
                        <div ref={groupMenuRef} className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setGroupActionError("");
                              setIsGroupMenuOpen((current) => !current);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:bg-white/10 hover:text-white"
                            aria-label="Group actions"
                          >
                            <MoreIcon />
                          </button>
                          {isGroupMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                              <button
                                type="button"
                                onClick={handleDeleteGroup}
                                disabled={isDeletingGroup}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-[#ff9db2] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <span>Delete group</span>
                                {isDeletingGroup ? <span className="text-xs text-[#ff9db2]/70">...</span> : null}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-1 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      disabled={!selectedGroup.is_member}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-[#fe2c55] text-white" : "border border-white/12 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"} ${!selectedGroup.is_member ? "cursor-not-allowed opacity-55" : ""}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {selectedGroup.is_member && groupDetailsErrorById[selectedGroup.id] ? (
                  <div className="mt-4 rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">{groupDetailsErrorById[selectedGroup.id]}</div>
                ) : null}
                {groupActionError ? <div className="mt-4 rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">{groupActionError}</div> : null}
              </div>

              <div className={`min-h-0 flex-1 ${activeTab === "chat" || activeTab === "posts" ? "flex flex-col" : "overflow-y-auto px-6 py-6 sm:px-8"}`}>{renderTabPanel()}</div>
        </section>
      ) : (
        renderGroupListPage()
      )}

      {isInviteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <section
            className="w-full max-w-md rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0b0b0b_100%)] p-6 text-white shadow-[0_32px_90px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">Members</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Invitations</h2>
              </div>
              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10">Close</button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setInviteModalTab("invite")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  inviteModalTab === "invite" ? "bg-[#fe2c55] text-white" : "border border-white/12 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"
                }`}
              >
                Invite
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteModalTab("sent");
                  handleLoadSentInvitations();
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  inviteModalTab === "sent" ? "bg-[#fe2c55] text-white" : "border border-white/12 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"
                }`}
              >
                Sent
              </button>
            </div>

            {inviteError ? <p className="mt-3 text-sm text-[#ff9db2]">{inviteError}</p> : null}

            {inviteModalTab === "invite" ? (
              <>
                <div className="mt-4">
                  <input
                    type="text"
                    value={inviteSearchInput}
                    onChange={(e) => {
                      setInviteSearchInput(e.target.value);
                      handleInviteSearch(e.target.value);
                    }}
                    placeholder="Search by name or username..."
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                  />
                </div>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {inviteSearchLoading ? (
                    <p className="py-4 text-center text-sm text-white/45">Searching...</p>
                  ) : inviteSearchResults.length === 0 && inviteSearchInput.trim() ? (
                    <p className="py-4 text-center text-sm text-white/45">No users found</p>
                  ) : inviteSearchResults.map((user) => {
                    const sent = inviteSentByUserId[user.id];
                    const loading = inviteLoadingByUserId[user.id];
                    const isMember = (membersByGroupId[selectedGroup?.id] || []).some((m) => m.user_id === user.id);
                    return (
                      <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <UserAvatar avatarPath={user.avatar_path} label={user.nickname || user.id} status={user.status} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{user.nickname || user.id}</p>
                          {user.first_name || user.last_name ? <p className="truncate text-xs text-white/45">{[user.first_name, user.last_name].filter(Boolean).join(" ")}</p> : null}
                        </div>
                        {isMember ? (
                          <span className="shrink-0 text-xs text-white/38">Member</span>
                        ) : sent ? (
                          <span className="shrink-0 text-xs text-white/38">Invited ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendInvitation(user.id)}
                            disabled={loading}
                            className="shrink-0 rounded-full bg-[#fe2c55] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loading ? "..." : "Invite"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {sentInvitationsLoading ? (
                  <p className="py-4 text-center text-sm text-white/45">Loading...</p>
                ) : sentInvitations.length === 0 ? (
                  <p className="py-4 text-center text-sm text-white/45">No pending invitations</p>
                ) : sentInvitations.map((inv) => {
                  const key = `${inv.group_id}:${inv.invitee_id}`;
                  return (
                    <div key={inv.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <UserAvatar avatarPath={inv.avatar_path} label={inv.invitee_nickname || inv.invitee_id} status={inv.invitee_status} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{inv.invitee_nickname || inv.invitee_id}</p>
                        <p className="text-xs text-white/38">Pending</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.group_id, inv.invitee_id)}
                        disabled={Boolean(cancelInviteLoadingByKey[key])}
                        className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancelInviteLoadingByKey[key] ? "..." : "Cancel"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {isCreateGroupPostOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => !isCreatingGroupPost && setIsCreateGroupPostOpen(false)}
        >
          <section
            className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0b0b0b_100%)] p-6 text-white shadow-[0_32px_90px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">New Post</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Create a post</h2>
              </div>
              <button
                type="button"
                onClick={() => !isCreatingGroupPost && setIsCreateGroupPostOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Title</span>
                <input
                  type="text"
                  value={createGroupPostTitle}
                  onChange={(e) => setCreateGroupPostTitle(e.target.value)}
                  placeholder="Give your post a title"
                  disabled={isCreatingGroupPost}
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Content</span>
                <textarea
                  value={createGroupPostContent}
                  onChange={(e) => setCreateGroupPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  disabled={isCreatingGroupPost}
                  className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Image (optional)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  disabled={isCreatingGroupPost}
                  onChange={(e) => setCreateGroupPostImageFile(e.target.files?.[0] || null)}
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[#fe2c55] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                />
                {createGroupPostImageFile ? (
                  <p className="mt-2 text-xs text-white/40">Selected: {createGroupPostImageFile.name}</p>
                ) : null}
              </label>

              {createGroupPostError ? (
                <div className="rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">
                  {createGroupPostError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !isCreatingGroupPost && setIsCreateGroupPostOpen(false)}
                className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupPost}
                disabled={isCreatingGroupPost || !createGroupPostTitle.trim() || !createGroupPostContent.trim()}
                className="rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingGroupPost ? "Posting..." : "Post"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {attendeesModalEventId ? (() => {
        const modalEvent = (eventsByGroupId[selectedGroup?.id] || []).find((e) => e.id === attendeesModalEventId);
        const allResponses = allEventResponsesByEventId[attendeesModalEventId] || [];
        const goingList = allResponses.filter((r) => r.response === "going");
        const notGoingList = allResponses.filter((r) => r.response === "not_going");

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            onClick={() => setAttendeesModalEventId(null)}
          >
            <section
              className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0b0b0b_100%)] p-6 text-white shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#fe8ea4]">{modalEvent ? formatLongDate(modalEvent.event_time) : ""}</p>
                  <h2 className="mt-1.5 text-xl font-semibold text-white">{modalEvent?.title || "Attendees"}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAttendeesModalEventId(null)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fe8ea4]">Going ({goingList.length})</p>
                  {goingList.length === 0 ? (
                    <p className="text-xs text-white/30">No one yet</p>
                  ) : (
                    <div className="space-y-3">
                      {goingList.map((r) => (
                        <div key={r.user_id} className="flex items-center gap-2.5">
                          <div className="relative h-7 w-7 shrink-0">
                            {normalizeImagePath(r.avatar_path || "") ? (
                              <img src={normalizeImagePath(r.avatar_path)} alt={r.nickname || r.user_id} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">{getInitial(r.nickname || r.user_id)}</div>
                            )}
                          </div>
                          <span className="truncate text-sm text-white/85">{r.nickname || r.user_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Not Going ({notGoingList.length})</p>
                  {notGoingList.length === 0 ? (
                    <p className="text-xs text-white/30">No one yet</p>
                  ) : (
                    <div className="space-y-3">
                      {notGoingList.map((r) => (
                        <div key={r.user_id} className="flex items-center gap-2.5">
                          <div className="relative h-7 w-7 shrink-0">
                            {normalizeImagePath(r.avatar_path || "") ? (
                              <img src={normalizeImagePath(r.avatar_path)} alt={r.nickname || r.user_id} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">{getInitial(r.nickname || r.user_id)}</div>
                            )}
                          </div>
                          <span className="truncate text-sm text-white/50">{r.nickname || r.user_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {allResponses.length === 0 ? (
                <p className="mt-4 text-center text-sm text-white/35">No responses yet. Members haven&apos;t replied to this event.</p>
              ) : null}
            </section>
          </div>
        );
      })() : null}

      {isCreateEventOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => !isCreatingEvent && setIsCreateEventOpen(false)}
        >
          <section
            className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0b0b0b_100%)] p-6 text-white shadow-[0_32px_90px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">New Event</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Create an event</h2>
              </div>
              <button
                type="button"
                onClick={() => !isCreatingEvent && setIsCreateEventOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Title</span>
                <input
                  type="text"
                  value={createEventTitle}
                  onChange={(e) => setCreateEventTitle(e.target.value)}
                  placeholder="Team Meetup"
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Description</span>
                <textarea
                  value={createEventDescription}
                  onChange={(e) => setCreateEventDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this event about?"
                  className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Date and time</span>
                <input
                  type="datetime-local"
                  value={createEventTime}
                  onChange={(e) => setCreateEventTime(e.target.value)}
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
                />
              </label>

              {createEventError ? (
                <div className="rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">
                  {createEventError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !isCreatingEvent && setIsCreateEventOpen(false)}
                className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={isCreatingEvent}
                className="rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingEvent ? "Creating..." : "Create event"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => !isCreatingGroup && setIsCreateGroupOpen(false)}>
          <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0b0b0b_100%)] p-6 text-white shadow-[0_32px_90px_rgba(0,0,0,0.5)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">New Group</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Create a community</h2>
              </div>
              <button
                type="button"
                onClick={() => !isCreatingGroup && setIsCreateGroupOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Title</span>
                <input
                  type="text"
                  value={createGroupTitle}
                  onChange={(event) => setCreateGroupTitle(event.target.value)}
                  placeholder="Photography Lovers"
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Description</span>
                <textarea
                  value={createGroupDescription}
                  onChange={(event) => setCreateGroupDescription(event.target.value)}
                  rows={4}
                  placeholder="What is this group about?"
                  className="w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Group avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCreateGroupAvatarFile(event.target.files?.[0] || null)}
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[#fe2c55] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {createGroupAvatarFile ? (
                  <p className="mt-2 text-xs text-white/40">Selected: {createGroupAvatarFile.name}</p>
                ) : null}
              </label>

              {createGroupError ? (
                <div className="rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">
                  {createGroupError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !isCreatingGroup && setIsCreateGroupOpen(false)}
                className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={isCreatingGroup}
                className="rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingGroup ? "Creating..." : "Create group"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {expandedImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseExpandedImage}
        >
          <button
            type="button"
            onClick={handleCloseExpandedImage}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-xl text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close image preview"
          >
            X
          </button>
          <div
            className="max-h-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0f0f10] shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={expandedImageUrl}
              alt="Expanded message image"
              className="max-h-[calc(100vh-3rem)] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
