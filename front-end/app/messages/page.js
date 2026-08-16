"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmojiPicker from "emoji-picker-react";
import { normalizeImagePath } from "@/app/posts/_components/post-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";
const THREAD_LIMIT = 50;
const MESSAGE_LIMIT = 20;
const TYPING_HEARTBEAT_MS = 2000;
const REMOTE_TYPING_TIMEOUT_MS = 5000;
const MESSAGE_FETCH_THROTTLE_MS = 350;

function parseDisplayName(thread) {
  const fullName = [thread?.first_name, thread?.last_name].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  if (thread?.nickname) {
    return thread.nickname;
  }

  return "Unknown user";
}

function sortThreadsByLatestActivity(threads) {
  return [...threads].sort((left, right) => {
    const leftTime = left?.last_message_at ? new Date(left.last_message_at).getTime() : 0;
    const rightTime = right?.last_message_at ? new Date(right.last_message_at).getTime() : 0;

    return rightTime - leftTime;
  });
}

function mapConversationToThread(thread) {
  return {
    id: thread.user_id,
    user_id: thread.user_id,
    name: parseDisplayName(thread),
    nickname: thread.nickname || "",
    first_name: thread.first_name || "",
    last_name: thread.last_name || "",
    handle: thread.nickname ? `@${thread.nickname}` : `@${String(thread.user_id || "user").slice(0, 8)}`,
    avatar_path: thread.avatar_path || "",
    preview: thread.last_message || "Start the conversation",
    lastSeen: formatThreadDate(thread.last_message_at),
    last_message_at: thread.last_message_at || "",
    last_sender_id: thread.last_sender_id || "",
    unreadCount: Number(thread.unread_count || 0),
    status: thread.status || "offline",
  };
}

function parseResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
}

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

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatThreadDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMessageDateLabel(value) {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function shouldShowDateDivider(previousMessage, currentMessage) {
  if (!currentMessage?.created_at) {
    return false;
  }

  if (!previousMessage?.created_at) {
    return true;
  }

  const previousDate = new Date(previousMessage.created_at);
  const currentDate = new Date(currentMessage.created_at);

  return previousDate.toDateString() !== currentDate.toDateString();
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
          : "border-black/10 bg-black/5 hover:bg-black/10"
      }`}
    >
      {avatarPath ? (
        <img src={normalizeImagePath(avatarPath)} alt={displayName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isOwnMessage ? "bg-white/15 text-white" : "bg-black/10 text-black"
        }`}>{initial}</div>
      )}
      <div className="min-w-0">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
          isOwnMessage ? "text-white/40" : "text-black/35"
        }`}>Shared Profile</p>
        <p className={`truncate text-sm font-semibold ${
          isOwnMessage ? "text-white" : "text-black"
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
          : "border-black/10 bg-black/5 hover:bg-black/10"
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
          isOwnMessage ? "text-white/40" : "text-black/35"
        }`}>Shared Post</p>
        <p className={`line-clamp-2 text-sm font-semibold leading-5 ${
          isOwnMessage ? "text-white" : "text-black"
        }`}>{postTitle}</p>
      </div>
    </a>
  );
}

function renderMessageContent(content, isOwnMessage) {
  const sharedPost = parseSharedPost(content);
  if (sharedPost) {
    return <SharedPostCard label={sharedPost.label} url={sharedPost.url} postId={sharedPost.postId} isOwnMessage={isOwnMessage} />;
  }

  const sharedProfile = parseSharedProfile(content);
  if (sharedProfile) {
    return <SharedProfileCard label={sharedProfile.label} url={sharedProfile.url} userId={sharedProfile.userId} isOwnMessage={isOwnMessage} />;
  }

  const text = String(content || "");
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className={isOwnMessage ? "underline decoration-white/60 underline-offset-2 break-all hover:text-white/80" : "underline decoration-black/45 underline-offset-2 break-all hover:text-black/70"}
        >
          {part}
        </a>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });
  const payload = parseResponse(await response.json().catch(() => null));

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error || payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-black">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-black/70 [animation-delay:-300ms]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-black/55 [animation-delay:-150ms]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-black/40" />
    </div>
  );
}

function getInitials(name) {
  return String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ThreadAvatar({ thread, size = "md" }) {
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-xs";
  const statusClass = size === "lg" ? "h-3.5 w-3.5 border-[3px]" : "h-3 w-3 border-2";
  const imagePath = thread?.avatar_path ? normalizeImagePath(thread.avatar_path) : "";
  const isOnline = String(thread?.status || "").toLowerCase() === "online";
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusDot = (
    <span
      className={`absolute bottom-0 right-0 rounded-full border-black ${isOnline ? "bg-emerald-400" : "bg-[#ff3b5f]"} ${statusClass}`}
      aria-label={statusLabel}
      title={statusLabel}
    />
  );

  if (imagePath) {
    return (
      <span className="relative shrink-0">
        <img src={imagePath} alt={thread.name} className={`${sizeClass} rounded-full object-cover`} />
        {statusDot}
      </span>
    );
  }

  return (
    <span className="relative shrink-0">
      <span className={`flex ${sizeClass} items-center justify-center rounded-full bg-white/10 font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}>
        {getInitials(thread.name)}
      </span>
      {statusDot}
    </span>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageListRef = useRef(null);
  const composerRef = useRef(null);
  const draftInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const localTypingHeartbeatRef = useRef(null);
  const localTypingThreadRef = useRef("");
  const localTypingStateRef = useRef(false);
  const draftMessageRef = useRef("");
  const remoteTypingTimeoutRef = useRef(null);
  const messagePaginationThrottleRef = useRef(0);
  const pendingPrependRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);
  const readRequestRef = useRef({ threadId: "", inFlight: false });
  const shouldReconnectRef = useRef(true);
  const activeThreadIdRef = useRef("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [nextMessageCursor, setNextMessageCursor] = useState("");
  const [activeThreadId, setActiveThreadId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("");
  const [expandedImageUrl, setExpandedImageUrl] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [pageError, setPageError] = useState("");
  const [threadError, setThreadError] = useState("");
  const requestedUserId = searchParams.get("userId") ?? "";
  const requestedFirstName = searchParams.get("firstName") ?? "";
  const requestedLastName = searchParams.get("lastName") ?? "";
  const requestedNickname = searchParams.get("nickname") ?? "";
  const requestedAvatar = searchParams.get("avatar") ?? "";
  const requestedThread = useMemo(() => {
    if (!requestedUserId) {
      return null;
    }

    return {
      id: requestedUserId,
      user_id: requestedUserId,
      name: parseDisplayName({
        first_name: requestedFirstName,
        last_name: requestedLastName,
        nickname: requestedNickname,
      }),
      nickname: requestedNickname,
      first_name: requestedFirstName,
      last_name: requestedLastName,
      handle: requestedNickname
        ? `@${requestedNickname}`
        : `@${String(requestedUserId).slice(0, 8)}`,
      avatar_path: requestedAvatar,
      preview: "Start the conversation",
      lastSeen: "",
      last_message_at: "",
      last_sender_id: "",
      unreadCount: 0,
    };
  }, [requestedAvatar, requestedFirstName, requestedLastName, requestedNickname, requestedUserId]);
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [activeThreadId, threads]
  );

  const filteredThreads = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return threads;
    }

    return threads.filter(
      (thread) =>
        thread.name.toLowerCase().includes(query) ||
        thread.handle.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query)
    );
  }, [searchValue, threads]);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

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
      if (!(composerRef.current instanceof HTMLElement)) {
        return;
      }

      if (composerRef.current.contains(event.target)) {
        return;
      }

      setIsEmojiPickerOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isEmojiPickerOpen]);

  function isNearBottom() {
    const container = messageListRef.current;
    if (!container) {
      return true;
    }

    return container.scrollHeight - container.scrollTop - container.clientHeight < 72;
  }

  function buildMessagesUrl(threadId, cursor = "") {
    const params = new URLSearchParams({ limit: String(MESSAGE_LIMIT) });
    if (cursor) {
      params.set("cursor", cursor);
    }

    return `${API_BASE_URL}/api/chat/private/${threadId}?${params.toString()}`;
  }

  async function fetchMessagePage(threadId, cursor = "") {
    return getJson(buildMessagesUrl(threadId, cursor));
  }

  async function markThreadRead(threadId) {
    if (!threadId) {
      return;
    }

    if (readRequestRef.current.inFlight && readRequestRef.current.threadId === threadId) {
      return;
    }

    readRequestRef.current = {
      threadId,
      inFlight: true,
    };

    try {
      const summary = await getJson(`${API_BASE_URL}/api/chat/private/${threadId}/read`, {
        method: "POST",
      });
      mergeThreadSummary(summary);
    } catch {
      // Ignore read-sync failures so live chat still works.
    } finally {
      if (readRequestRef.current.threadId === threadId) {
        readRequestRef.current = {
          threadId: "",
          inFlight: false,
        };
      }
    }
  }

  function clearRemoteTyping() {
    if (remoteTypingTimeoutRef.current) {
      window.clearTimeout(remoteTypingTimeoutRef.current);
      remoteTypingTimeoutRef.current = null;
    }

    setIsPeerTyping(false);
  }

  function sendTypingState(threadId, isTyping) {
    if (!threadId) {
      return false;
    }

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(
      JSON.stringify({
        type: "chat:private:typing",
        data: {
          recipient_id: threadId,
          is_typing: isTyping,
        },
      })
    );
    return true;
  }

  function startLocalTypingHeartbeat(threadId) {
    if (!threadId) {
      return;
    }

    if (localTypingHeartbeatRef.current) {
      window.clearInterval(localTypingHeartbeatRef.current);
    }

    localTypingHeartbeatRef.current = window.setInterval(() => {
      if (!localTypingStateRef.current || localTypingThreadRef.current !== threadId) {
        return;
      }

      if (!draftMessageRef.current.trim()) {
        stopLocalTyping(threadId);
        return;
      }

      sendTypingState(threadId, true);
    }, TYPING_HEARTBEAT_MS);
  }

  function stopLocalTyping(threadId = localTypingThreadRef.current) {
    if (localTypingHeartbeatRef.current) {
      window.clearInterval(localTypingHeartbeatRef.current);
      localTypingHeartbeatRef.current = null;
    }

    if (!localTypingStateRef.current || !threadId) {
      localTypingStateRef.current = false;
      localTypingThreadRef.current = threadId || "";
      return;
    }

    sendTypingState(threadId, false);
    localTypingStateRef.current = false;
    localTypingThreadRef.current = threadId;
  }

  function handleDraftTyping(nextValue) {
    setDraftMessage(nextValue);
    draftMessageRef.current = nextValue;

    const threadId = activeThreadIdRef.current;
    if (!threadId) {
      return;
    }

    if (!nextValue.trim()) {
      stopLocalTyping(threadId);
      return;
    }

    if (localTypingThreadRef.current && localTypingThreadRef.current !== threadId) {
      stopLocalTyping(localTypingThreadRef.current);
    }

    localTypingThreadRef.current = threadId;

    if (!localTypingStateRef.current) {
      localTypingStateRef.current = sendTypingState(threadId, true);
    }

    if (localTypingStateRef.current) {
      startLocalTypingHeartbeat(threadId);
    }
  }

  function handleEmojiSelect(emojiData) {
    const emoji = emojiData?.emoji || "";
    if (!emoji) {
      return;
    }

    const input = draftInputRef.current;

    if (input instanceof HTMLInputElement) {
      const selectionStart = input.selectionStart ?? draftMessage.length;
      const selectionEnd = input.selectionEnd ?? draftMessage.length;
      const nextValue = `${draftMessage.slice(0, selectionStart)}${emoji}${draftMessage.slice(selectionEnd)}`;
      handleDraftTyping(nextValue);

      window.requestAnimationFrame(() => {
        input.focus();
        const nextCursorPosition = selectionStart + emoji.length;
        input.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    } else {
      handleDraftTyping(`${draftMessage}${emoji}`);
    }

    setIsEmojiPickerOpen(false);
  }

  function clearSelectedImage() {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImage(null);
    setSelectedImagePreviewUrl("");

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  }

  function handleAttachmentClick() {
    if (isSending) {
      return;
    }

    attachmentInputRef.current?.click();
  }

  function handleAttachmentChange(event) {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      clearSelectedImage();
      return;
    }

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImage(nextFile);
    setSelectedImagePreviewUrl(URL.createObjectURL(nextFile));
    setThreadError("");
  }

  function handleOpenExpandedImage(imagePath) {
    const normalizedPath = normalizeImagePath(imagePath);
    if (!normalizedPath) {
      return;
    }

    setExpandedImageUrl(normalizedPath);
  }

  function handleCloseExpandedImage() {
    setExpandedImageUrl("");
  }

  async function loadThreadMessages(threadId, options = {}) {
    if (!threadId) {
      if (!options.silent) {
        setMessages([]);
        setNextMessageCursor("");
      }
      return [];
    }

    if (!options.silent) {
      setIsMessagesLoading(true);
      setThreadError("");
    }

    try {
      const data = await fetchMessagePage(threadId);
      const nextMessages = [...(data?.messages || [])].sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      );

      shouldScrollToBottomRef.current = options.scrollToBottom !== false;
      setMessages(nextMessages);
      setNextMessageCursor(data?.next_cursor || "");
      if (options.clearError !== false) {
        setThreadError("");
      }

      return nextMessages;
    } catch (error) {
      if (!options.silent) {
        setThreadError(error instanceof Error ? error.message : "Failed to load conversation");
        setMessages([]);
        setNextMessageCursor("");
      }

      return [];
    } finally {
      if (!options.silent) {
        setIsMessagesLoading(false);
      }
    }
  }

  async function loadOlderMessages() {
    const threadId = activeThreadIdRef.current;
    const cursor = nextMessageCursor;

    if (!threadId || !cursor || isLoadingOlderMessages) {
      return;
    }

    const now = Date.now();
    if (now - messagePaginationThrottleRef.current < MESSAGE_FETCH_THROTTLE_MS) {
      return;
    }
    messagePaginationThrottleRef.current = now;

    setIsLoadingOlderMessages(true);

    try {
      const container = messageListRef.current;
      if (container) {
        pendingPrependRef.current = {
          previousScrollHeight: container.scrollHeight,
          previousScrollTop: container.scrollTop,
        };
      }

      const data = await fetchMessagePage(threadId, cursor);
      const olderMessages = [...(data?.messages || [])].sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      );

      setMessages((currentMessages) => {
        const existingIds = new Set(currentMessages.map((message) => message.id));
        const uniqueOlderMessages = olderMessages.filter((message) => !existingIds.has(message.id));
        return [...uniqueOlderMessages, ...currentMessages];
      });
      setNextMessageCursor(data?.next_cursor || "");
    } catch (error) {
      pendingPrependRef.current = null;
      setThreadError(error instanceof Error ? error.message : "Failed to load older messages");
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }

  function handleMessagesScroll(event) {
    if (event.currentTarget.scrollTop > 80) {
      return;
    }

    void loadOlderMessages();
  }

  function mergeThreadSummary(summary) {
    if (!summary?.user_id) {
      return;
    }

    const nextThread = mapConversationToThread(summary);

    setThreads((currentThreads) => {
      const existingIndex = currentThreads.findIndex((thread) => thread.id === nextThread.id);

      if (existingIndex === -1) {
        return [nextThread, ...currentThreads];
      }

      const updatedThreads = [...currentThreads];
      updatedThreads[existingIndex] = {
        ...updatedThreads[existingIndex],
        ...nextThread,
      };

      return updatedThreads;
    });
  }

  function appendIncomingMessage(messageEvent) {
    const activeId = activeThreadIdRef.current;
    const otherUserId =
      messageEvent?.sender_id === currentUserId ? messageEvent?.recipient_id : messageEvent?.sender_id;

    if (!otherUserId || activeId !== otherUserId) {
      return;
    }

    setMessages((currentMessages) => {
      if (currentMessages.some((message) => message.id === messageEvent.id)) {
        return currentMessages;
      }

      shouldScrollToBottomRef.current = isNearBottom();

      return [
        ...currentMessages,
        {
          ...messageEvent,
          created_at: new Date().toISOString(),
        },
      ];
    });

    if (messageEvent?.sender_id === otherUserId && activeId === otherUserId) {
      void markThreadRead(otherUserId);
    }
  }

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || isMessagesLoading) {
      return;
    }

    if (pendingPrependRef.current) {
      const { previousScrollHeight, previousScrollTop } = pendingPrependRef.current;
      pendingPrependRef.current = null;
      container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
      return;
    }

    if (shouldScrollToBottomRef.current) {
      shouldScrollToBottomRef.current = false;
      container.scrollTop = container.scrollHeight;
    }
  }, [isMessagesLoading, isPeerTyping, messages]);

  useEffect(() => {
    let ignore = false;

    async function loadInbox() {
      setIsInboxLoading(true);
      setPageError("");

      try {
        const [meData, inboxData] = await Promise.all([
          getJson(`${API_BASE_URL}/api/auth/me`),
          getJson(`${API_BASE_URL}/api/chat/private/inbox?limit=${THREAD_LIMIT}`),
        ]);

        if (ignore) {
          return;
        }

        const nextThreads = (inboxData?.conversations || []).map(mapConversationToThread);
        const hasRequestedThread = requestedUserId
          ? nextThreads.some((thread) => thread.id === requestedUserId)
          : false;
        const mergedThreads =
          requestedThread && requestedUserId !== meData?.id && !hasRequestedThread
            ? [requestedThread, ...nextThreads]
            : nextThreads;

        setCurrentUserId(meData?.id || "");
        setThreads(sortThreadsByLatestActivity(mergedThreads));
        setActiveThreadId((current) => {
          if (requestedUserId) {
            return requestedUserId;
          }

          if (current && mergedThreads.some((thread) => thread.id === current)) {
            return current;
          }

          return "";
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        const isUnauthorized = error?.status === 401 || /unauthorized|login/i.test(error?.message || "");
        setCurrentUserId("");
        setThreads([]);
        setActiveThreadId("");
        setPageError(isUnauthorized ? "You need to log in to use messages." : error instanceof Error ? error.message : "Failed to load messages");
      } finally {
        if (!ignore) {
          setIsInboxLoading(false);
        }
      }
    }

    loadInbox();

    return () => {
      ignore = true;
    };
  }, [requestedThread, requestedUserId, router]);

  useEffect(() => {
    if (!requestedUserId) {
      return;
    }

    setThreads((currentThreads) => {
      if (!requestedThread) {
        return currentThreads;
      }

      const existingIndex = currentThreads.findIndex((thread) => thread.id === requestedUserId);
      if (existingIndex === -1) {
        return sortThreadsByLatestActivity([requestedThread, ...currentThreads]);
      }

      const nextThreads = [...currentThreads];
      nextThreads[existingIndex] = {
        ...nextThreads[existingIndex],
        ...requestedThread,
      };
      return sortThreadsByLatestActivity(nextThreads);
    });
    setActiveThreadId(requestedUserId);
  }, [requestedThread, requestedUserId]);

  useEffect(() => {
    let ignore = false;

    async function loadActiveThreadMessages() {
      if (!activeThread?.id) {
        setMessages([]);
        setNextMessageCursor("");
        return;
      }

      try {
        await loadThreadMessages(activeThread.id, { scrollToBottom: true });

        if (ignore) {
          return;
        }
      } catch (error) {
        if (!ignore) {
          setThreadError(error instanceof Error ? error.message : "Failed to load conversation");
          setMessages([]);
          setNextMessageCursor("");
        }
      }
    }

    loadActiveThreadMessages();

    return () => {
      ignore = true;
    };
  }, [activeThread?.id]);

  useEffect(() => {
    clearRemoteTyping();
    stopLocalTyping(localTypingThreadRef.current && localTypingThreadRef.current !== activeThreadId ? localTypingThreadRef.current : "");
    localTypingThreadRef.current = activeThreadId || "";
    setIsEmojiPickerOpen(false);

    return () => {
      clearRemoteTyping();
    };
  }, [activeThreadId]);

  useEffect(() => {
    if (!currentUserId) {
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

    function handleSocketMessage(event) {
      let payload = null;

      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!payload?.type) {
        return;
      }

      if (payload.type === "connected") {
        return;
      }

      if (payload.type === "chat:private:conversation-updated") {
        mergeThreadSummary(payload.data);
        return;
      }

      if (payload.type === "chat:private:new") {
        clearRemoteTyping();
        appendIncomingMessage(payload.data);
        return;
      }

      if (payload.type === "user:status") {
        const userId = payload.data?.user_id || "";
        const status = payload.data?.status || "offline";
        if (!userId) {
          return;
        }
        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            thread.id === userId ? { ...thread, status } : thread
          )
        );
        return;
      }

      if (payload.type === "chat:private:typing") {
        if (payload.data?.sender_id !== activeThreadIdRef.current) {
          return;
        }

        if (!payload.data?.is_typing) {
          clearRemoteTyping();
          return;
        }

        shouldScrollToBottomRef.current = true;
        setIsPeerTyping(true);
        if (remoteTypingTimeoutRef.current) {
          window.clearTimeout(remoteTypingTimeoutRef.current);
        }
        remoteTypingTimeoutRef.current = window.setTimeout(() => {
          remoteTypingTimeoutRef.current = null;
          setIsPeerTyping(false);
        }, REMOTE_TYPING_TIMEOUT_MS);
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
      stopLocalTyping();
      clearRemoteTyping();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [currentUserId]);

  async function refreshInbox(preferredThreadId = "") {
    const inboxData = await getJson(`${API_BASE_URL}/api/chat/private/inbox?limit=${THREAD_LIMIT}`);
    const nextThreads = sortThreadsByLatestActivity((inboxData?.conversations || []).map(mapConversationToThread));

    setThreads(nextThreads);
    setActiveThreadId((current) => {
      if (preferredThreadId) {
        return preferredThreadId;
      }

      if (current && nextThreads.some((thread) => thread.id === current)) {
        return current;
      }

      return "";
    });
  }

  async function handleSendMessage() {
    const content = draftMessage.trim();

    if ((!content && !selectedImage) || !activeThread?.id || isSending) {
      return;
    }

    stopLocalTyping(activeThread.id);
    setIsSending(true);
    setThreadError("");

    try {
    if (selectedImage) {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("image_path", selectedImage);

      await getJson(`${API_BASE_URL}/api/chat/private/${activeThread.id}`, {
        method: "POST",
        body: formData,
      });
    } else {
      await getJson(`${API_BASE_URL}/api/chat/private/${activeThread.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
    }

      setDraftMessage("");
      draftMessageRef.current = "";
      clearSelectedImage();

      const [inboxData, threadData] = await Promise.all([
        getJson(`${API_BASE_URL}/api/chat/private/inbox?limit=${THREAD_LIMIT}`),
        fetchMessagePage(activeThread.id),
      ]);

      const nextThreads = sortThreadsByLatestActivity((inboxData?.conversations || []).map(mapConversationToThread));

      setThreads(nextThreads);
      shouldScrollToBottomRef.current = true;
      setMessages(
        [...(threadData?.messages || [])].sort(
          (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
        )
      );
      setNextMessageCursor(threadData?.next_cursor || "");
      setActiveThreadId(activeThread.id);
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  function handleOpenGeneralSidebar() {
    window.dispatchEvent(new Event("app-shell:open-nav"));
  }

  return (
    <main className="h-screen overflow-hidden bg-black px-0 py-0 text-white">
      <div className="grid h-screen grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${activeThread ? "hidden xl:flex" : "flex"} min-h-0 flex-col border-b border-white/10 bg-[#090909] xl:border-b-0 xl:border-r xl:border-white/10`}>
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-white">Messages</p>
              <button
                type="button"
                onClick={handleOpenGeneralSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white xl:hidden"
                aria-label="Open general navigation"
              >
                <MenuIcon />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-white/45 transition focus-within:border-white/20 focus-within:text-white/70">
              <SearchIcon />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search messages"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
              />
            </div>
          </div>

          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
            {isInboxLoading ? (
              <div className="px-5 py-8 text-sm text-white/45">Loading conversations...</div>
            ) : null}
            {!isInboxLoading && !filteredThreads.length ? (
              <div className="px-5 py-8 text-sm text-white/45">
                <p>{pageError || "No conversations found."}</p>
                {pageError ? (
                  <Link
                    href="/auth/login"
                    className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white/90"
                  >
                    Log in
                  </Link>
                ) : null}
              </div>
            ) : null}
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThread?.id;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`flex w-full items-start gap-3 border-b border-white/6 px-5 py-4 text-left transition ${
                    isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <ThreadAvatar thread={thread} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{thread.name}</p>
                        <p className="truncate text-xs text-white/42">{thread.preview}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-white/32">{thread.lastSeen}</p>
                        {thread.unreadCount ? (
                          <span className="mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fe2c55] px-1.5 text-[10px] font-semibold text-white">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`${activeThread ? "flex" : "hidden xl:flex"} min-h-0 flex-col bg-black`}>
          {activeThread ? (
            <>
              <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveThreadId("")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white xl:hidden"
                    aria-label="Back to conversations"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                      <path d="M14.5 6.5 9 12l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <ThreadAvatar thread={activeThread} size="lg" />
                  <div>
                    <p className="text-base font-semibold text-white">{activeThread.name}</p>
                    <p className="text-sm text-white/42">{isPeerTyping ? "Typing..." : activeThread.handle}</p>
                  </div>
                </div>
              </header>

              <div
                ref={messageListRef}
                onScroll={handleMessagesScroll}
                className="theme-scrollbar flex-1 overflow-y-auto px-5 py-6 sm:px-8"
              >
                <div className="flex min-h-full w-full flex-col justify-end gap-6">
                  {isLoadingOlderMessages ? (
                    <div className="flex justify-center py-1">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                        Loading older messages...
                      </span>
                    </div>
                  ) : null}
                  {!isLoadingOlderMessages && nextMessageCursor ? (
                    <div className="flex justify-center py-1">
                      <span className="text-[11px] text-white/22">Scroll up to load older messages</span>
                    </div>
                  ) : null}
                  {isMessagesLoading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-white/40">
                      Loading conversation...
                    </div>
                  ) : null}
                  {threadError && !isMessagesLoading ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {threadError}
                    </div>
                  ) : null}
                  {!isMessagesLoading && !threadError && messages.length
                    ? messages.map((message, index) => (
                        <div key={message.id || `${message.sender_id}-${message.created_at}-${index}`} className="contents">
                          {shouldShowDateDivider(messages[index - 1], message) ? (
                            <div className="flex justify-center py-4">
                              <span className="text-[11px] text-white/30">
                                {formatMessageDateLabel(message.created_at)}
                              </span>
                            </div>
                          ) : null}
                          <div className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[320px] rounded-2xl px-4 py-2.5 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.25)] ${
                                message.sender_id === currentUserId
                                  ? "bg-white/12 text-white"
                                  : "bg-white text-black"
                              }`}
                            >
                              {message.image_path ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenExpandedImage(message.image_path)}
                                  className="mb-3 block w-full overflow-hidden rounded-2xl focus:outline-none"
                                  aria-label="Open image preview"
                                >
                                  <img
                                    src={normalizeImagePath(message.image_path)}
                                    alt={message.content || "Shared image"}
                                    className="max-h-72 w-full rounded-2xl object-cover transition hover:opacity-90"
                                  />
                                </button>
                              ) : null}
                              {message.content ? (
                                <div className="whitespace-pre-wrap break-words">
                                  {renderMessageContent(message.content, message.sender_id === currentUserId)}
                                </div>
                              ) : null}
                              {message.created_at ? (
                                <p className={`mt-1 text-right text-[11px] ${message.sender_id === currentUserId ? "text-white/50" : "text-black/40"}`}>
                                  {formatMessageTime(message.created_at)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                  {!isMessagesLoading && !threadError && isPeerTyping ? (
                    <div className="flex justify-start">
                      <div className="flex items-end gap-3">
                        <ThreadAvatar thread={activeThread} />
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                          <TypingIndicator />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {!isMessagesLoading && !threadError && !messages.length && !isPeerTyping ? (
                    <div className="flex flex-1 items-center justify-center">
                      <MessageOutlineIcon />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-white/10 px-5 py-4 sm:px-8">
                <div ref={composerRef} className="relative">
                  {isEmojiPickerOpen ? (
                    <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 w-[272px] rounded-[24px] border border-white/10 bg-[#131313] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] min-[500px]:right-12 min-[500px]:w-[360px] sm:w-[390px]">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
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
                        onClick={clearSelectedImage}
                        disabled={isSending}
                        className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <div className="flex w-full items-center gap-3">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAttachmentClick}
                    disabled={isSending}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label="Attach image"
                  >
                    <ImageIcon />
                  </button>
                  <input
                    ref={draftInputRef}
                    type="text"
                    value={draftMessage}
                    onChange={(event) => handleDraftTyping(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
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
                    onClick={handleSendMessage}
                    disabled={isSending || (!draftMessage.trim() && !selectedImage) || !activeThread?.id}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fe2c55] text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                  </div>
                </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <MessageOutlineIcon />
            </div>
          )}
        </section>
      </div>
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
