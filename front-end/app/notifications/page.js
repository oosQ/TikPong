"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";
const NOTIFICATION_LIMIT = 20;

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
    throw new Error(payload?.error || payload?.message || "Request failed");
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
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellOutlineIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="h-16 w-16 text-white/15">
      <path
        d="M24 6a12 12 0 0 0-12 12v7l-3 4a1.5 1.5 0 0 0 1.3 2.25h27.4a1.5 1.5 0 0 0 1.3-2.25l-3-4v-7a12 12 0 0 0-12-12ZM20 35a4 4 0 1 0 8 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M1.5 12.5 7 18l1.5-1.5M7 12.5 12.5 18 22.5 6M16 6l-5.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function safeParsePayload(payload) {
  if (!payload) {
    return {};
  }

  if (typeof payload === "object") {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function getNotificationDetail(notification) {
  const data = safeParsePayload(notification.payload);

  switch (notification.type) {
    case "private_message": {
      const name = data.sender_name || "";
      const preview = data.preview || "";
      const parts = [];
      if (name) {
        parts.push(name);
      }
      if (preview) {
        const trimmed = preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
        parts.push(`"${trimmed}"`);
      }
      return parts.length ? parts.join(": ") : null;
    }
    case "follow_request": {
      return data.from_user_name || null;
    }
    case "group_join_request": {
      const parts = [];
      if (data.requester_name) {
        parts.push(data.requester_name);
      }
      if (data.group_title) {
        parts.push(data.group_title);
      }
      return parts.length ? parts.join(" → ") : null;
    }
    case "group_event": {
      const parts = [];
      if (data.group_title) {
        parts.push(data.group_title);
      }
      if (data.event_title) {
        parts.push(data.event_title);
      }
      return parts.length ? parts.join(" — ") : null;
    }
    case "group_invitation": {
      const parts = [];
      if (data.inviter_name) {
        parts.push(`From ${data.inviter_name}`);
      }
      if (data.group_title) {
        parts.push(data.group_title);
      }
      return parts.length ? parts.join(" → ") : null;
    }
    default:
      return null;
  }
}

function getNotificationHref(notification) {
  const data = safeParsePayload(notification.payload);

  switch (notification.type) {
    case "private_message":
      return data.sender_id ? `/messages?userId=${data.sender_id}` : "/messages";
    case "follow_request":
      return data.from_user_id ? `/users/${data.from_user_id}` : "/users";
    case "group_join_request":
      return data.group_id ? `/groups?groupId=${data.group_id}&tab=join-requests` : "/groups";
    case "group_event":
      return data.group_id ? `/groups?groupId=${data.group_id}&tab=events` : "/groups";
    case "group_invitation":
      return data.group_id ? `/groups?groupId=${data.group_id}` : "/groups";
    default:
      return null;
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case "follow_request":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M17.5 19a5.5 5.5 0 0 0-11 0M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "private_message":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M6 7.5h12A2.5 2.5 0 0 1 20.5 10v6A2.5 2.5 0 0 1 18 18.5H9l-4.5 3V10A2.5 2.5 0 0 1 7 7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case "group_event":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "group_join_request":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M8 11.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM16.5 10a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM4.5 18.5a3.5 3.5 0 0 1 7 0M13 18a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case "group_invitation":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M22 12 2 4l3.5 8L2 20l20-8ZM5.5 12H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M12 3a6 6 0 0 0-6 6v3.5l-1.5 2a.75.75 0 0 0 .65 1.13h13.7a.75.75 0 0 0 .65-1.13l-1.5-2V9a6 6 0 0 0-6-6ZM10 17.5a2 2 0 1 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
  }
}

export default function NotificationsPage() {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [markingReadById, setMarkingReadById] = useState({});
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [invitationActionByGroupId, setInvitationActionByGroupId] = useState({});

  function handleOpenGeneralSidebar() {
    window.dispatchEvent(new Event("app-shell:open-nav"));
  }

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setPageError("");

      try {
        const [data, countData] = await Promise.all([
          getJson(`${API_BASE_URL}/api/notifications?limit=${NOTIFICATION_LIMIT}`),
          getJson(`${API_BASE_URL}/api/notifications/unread-count`),
        ]);
        setNotifications(data?.notifications || []);
        setNextCursor(data?.next_cursor || "");
        setUnreadCount(countData?.count ?? 0);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;

    function clearReconnectTimeout() {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      clearReconnectTimeout();

      if (!shouldReconnectRef.current) {
        return;
      }

      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (shouldReconnectRef.current) {
          connect();
        }
      }, 3000);
    }

    function handleSocketMessage(event) {
      let payload = null;

      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload?.type === "notification:new" && payload.data) {
        setNotifications((current) => {
          if (current.some((n) => n.id === payload.data.id)) {
            return current;
          }

          return [payload.data, ...current];
        });
        setUnreadCount((current) => current + 1);
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
        if (socketRef.current === socket) {
          socketRef.current = null;
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
  }, []);

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const data = await getJson(`${API_BASE_URL}/api/notifications?limit=${NOTIFICATION_LIMIT}&cursor=${nextCursor}`);
      const nextItems = data?.notifications || [];

      setNotifications((current) => {
        const existingIds = new Set(current.map((n) => n.id));
        const newItems = nextItems.filter((n) => !existingIds.has(n.id));
        return [...current, ...newItems];
      });
      setNextCursor(data?.next_cursor || "");
    } catch {
      // Silently ignore load-more errors
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleMarkAsRead(notificationId) {
    if (markingReadById[notificationId]) {
      return;
    }

    setMarkingReadById((current) => ({ ...current, [notificationId]: true }));

    try {
      await getJson(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      setNotifications((current) =>
        current.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      // Silently ignore
    } finally {
      setMarkingReadById((current) => ({ ...current, [notificationId]: false }));
    }
  }

  async function handleMarkAllAsRead() {
    if (isMarkingAllRead) {
      return;
    }

    setIsMarkingAllRead(true);

    try {
      await getJson(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "POST",
      });

      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  async function handleInvitationResponse(groupId, notificationId, action) {
    if (!groupId || invitationActionByGroupId[groupId]) return;
    setInvitationActionByGroupId((current) => ({ ...current, [groupId]: action }));
    try {
      await getJson(`${API_BASE_URL}/api/groups/${groupId}/invitations/me/${action}`, { method: "POST" });
      setInvitationActionByGroupId((current) => ({ ...current, [groupId]: "done" }));
      if (notificationId) handleMarkAsRead(notificationId);
    } catch {
      setInvitationActionByGroupId((current) => ({ ...current, [groupId]: null }));
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-black px-0 py-0 text-white">
      <div className="flex h-screen flex-col">
        <div className="border-b border-white/10 px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight text-white">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckAllIcon />
                  {isMarkingAllRead ? "Marking..." : "Read all"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleOpenGeneralSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white min-[1200px]:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                filter === "all"
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                filter === "unread"
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          </div>
        </div>

        <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-white/45 sm:px-8">Loading notifications...</div>
          ) : pageError ? (
            <div className="px-5 py-8 sm:px-8">
              <div className="rounded-2xl border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-4 py-3 text-sm text-[#ffd6df]">
                {pageError}
              </div>
            </div>
          ) : !filteredNotifications.length ? (
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
              <BellOutlineIcon />
              <p className="mt-4 text-sm text-white/45">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredNotifications.map((notification) => {
                const detail = getNotificationDetail(notification);
                const href = getNotificationHref(notification);

                return (
                notification.type === "group_invitation" ? (() => {
                  const data = safeParsePayload(notification.payload);
                  const groupId = data?.group_id;
                  const actionState = invitationActionByGroupId[groupId];
                  const isDone = actionState === "done";
                  return (
                    <div
                      key={notification.id}
                      className={`flex w-full items-start gap-4 px-5 py-4 text-left ${
                        notification.is_read ? "opacity-65" : "bg-white/[0.02]"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{notification.title}</p>
                          <span className="shrink-0 text-[11px] text-white/38">{formatRelativeDate(notification.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-white/55">{notification.message}</p>
                        {detail ? <p className="mt-1 truncate text-xs text-white/35">{detail}</p> : null}
                        {!isDone && groupId ? (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleInvitationResponse(groupId, notification.id, "accept")}
                              disabled={Boolean(actionState)}
                              className="rounded-full bg-[#fe2c55] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionState === "accept" ? "Accepting..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInvitationResponse(groupId, notification.id, "reject")}
                              disabled={Boolean(actionState)}
                              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionState === "reject" ? "Rejecting..." : "Decline"}
                            </button>
                          </div>
                        ) : isDone ? (
                          <p className="mt-2 text-xs text-white/38">Invitation responded</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })() :
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (href) {
                      router.push(href);
                    }
                  }}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition sm:px-8 ${
                    notification.is_read
                      ? "bg-transparent opacity-65 hover:bg-white/[0.03]"
                      : "bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{notification.title}</p>
                      <span className="shrink-0 text-[11px] text-white/38">{formatRelativeDate(notification.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">{notification.message}</p>
                    {detail ? (
                      <p className="mt-1.5 truncate text-xs leading-relaxed text-white/35">{detail}</p>
                    ) : null}
                  </div>
                  {!notification.is_read ? (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#fe2c55]" />
                  ) : null}
                </button>
                );
              })}
              {nextCursor ? (
                <div className="px-5 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full rounded-full border border-white/10 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
