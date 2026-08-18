"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

function buildWebSocketUrl(baseUrl) {
  if (!baseUrl) return "";
  if (baseUrl.startsWith("https://")) return `${baseUrl.replace(/^https:\/\//, "wss://")}/ws`;
  if (baseUrl.startsWith("http://")) return `${baseUrl.replace(/^http:\/\//, "ws://")}/ws`;
  return `${baseUrl}/ws`;
}

const NOTIFICATION_ICONS = {
  follow_request: {
    viewBox: "0 0 640 512",
    path: "M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z",
  },
  private_message: {
    viewBox: "0 0 512 512",
    path: "M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c20.5-20.8 34.2-43.7 39.2-66.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z",
  },
  group_event: {
    viewBox: "0 0 448 512",
    path: "M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z",
  },
  group_join_request: {
    viewBox: "0 0 640 512",
    path: "M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z",
  },
  group_invitation: {
    viewBox: "0 0 512 512",
    path: "M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-126.3-52.5-72.4 78.1c-8.9 9.7-22.9 12.8-35.2 8s-20.4-16.6-20.4-29.8V391.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-5.8 6-15.1.3-21s-15-6.2-21-.7L94.7 379.4 10.8 337.6C.9 332.7-5.4 322.8-5 311.8s7.5-20.4 17.8-24.2l448-160c11.6-4.1 24.5-1.1 32.9 7.8z",
  },
};

function NotificationTypeIcon({ type }) {
  const icon = NOTIFICATION_ICONS[type] || {
    viewBox: "0 0 448 512",
    path: "M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v87.9c0 18.6-6.5 36.6-18.3 51L7.4 395.8C2.6 402 0 409.6 0 417.5C0 434.3 13.7 448 30.5 448h387c16.8 0 30.5-13.7 30.5-30.5c0-7.9-2.6-15.5-7.4-21.7l-38.3-48.9c-11.8-14.4-18.3-32.4-18.3-51V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zM176 480a48 48 0 1 0 96 0h-96z",
  };

  return (
    <svg viewBox={icon.viewBox} fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d={icon.path} />
    </svg>
  );
}

function getRealtimeNotificationKey(notification) {
  const payload = notification?.payload && typeof notification.payload === "object"
    ? notification.payload
    : {};
  if (notification?.type === "follow" || notification?.type === "follow_request") {
    return payload.from_user_id ? `${notification.type}:${payload.from_user_id}` : notification.id;
  }
  if (notification?.type === "group_join_request") {
    return `${notification.type}:${payload.group_id || ""}:${payload.requester_id || payload.requester_user_id || ""}`;
  }
  if (notification?.type === "group_invitation") {
    return `${notification.type}:${payload.group_id || notification.id}`;
  }
  return notification?.id || `${notification?.type || "notification"}:${Date.now()}`;
}

function normalizeImagePath(imagePath) {
  const value = String(imagePath || "").trim();

  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  if (value.startsWith("./")) {
    return `${API_BASE_URL}/${value.slice(2)}`;
  }

  return `${API_BASE_URL}/${value}`;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
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

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6 7.5h12A2.5 2.5 0 0 1 20.5 10v6A2.5 2.5 0 0 1 18 18.5H9l-4.5 3V10A2.5 2.5 0 0 1 7 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 12h7M8.5 15h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7.5 12a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM16.5 11a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM3.5 18.5a4 4 0 0 1 8 0M13.25 18.5a3.25 3.25 0 0 1 6.5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3a6 6 0 0 0-6 6v3.5l-1.5 2a.75.75 0 0 0 .65 1.13h13.7a.75.75 0 0 0 .65-1.13l-1.5-2V9a6 6 0 0 0-6-6ZM10 17.5a2 2 0 1 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function getInitial(label) {
  const normalizedLabel = String(label || "").trim();

  if (!normalizedLabel) {
    return "U";
  }

  return normalizedLabel.charAt(0).toUpperCase();
}

function getDisplayName(user) {
  const fullName = [user?.first_name ?? user?.firstName, user?.last_name ?? user?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (user?.nickname) {
    return user.nickname;
  }

  return "Guest";
}

function renderSidebarAvatar(user, sizeClassName = "h-11 w-11") {
  return <SidebarAvatar user={user} sizeClassName={sizeClassName} />;
}

function SidebarAvatar({ user, sizeClassName = "h-11 w-11" }) {
  const [hasImageError, setHasImageError] = useState(false);
  const label = getDisplayName(user);
  const avatarPath = String(user?.avatar_path || "").trim();

  return (
    <span className="inline-flex shrink-0 rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px] shadow-[0_12px_34px_rgba(0,0,0,0.35)]">
      {avatarPath && !hasImageError ? (
        <img
          src={normalizeImagePath(avatarPath)}
          alt={label}
          onError={() => setHasImageError(true)}
          className={`${sizeClassName} rounded-full border-2 border-black object-cover`}
        />
      ) : (
        <span className={`flex items-center justify-center rounded-full border-2 border-black bg-white text-sm font-semibold text-black ${sizeClassName}`}>
          {getInitial(label)}
        </span>
      )}
    </span>
  );
}

function isActivePath(pathname, itemKey, activeQuery, sourceQuery, modeQuery) {
  if (itemKey === "for-you") {
		return pathname === "/posts" && !activeQuery && modeQuery !== "explore";
  }

  if (itemKey === "explore") {
		return pathname.startsWith("/hashtags/") || modeQuery === "explore";
  }

  if (itemKey === "upload") {
    return pathname === "/post/create-post";
  }

  if (itemKey === "groups") {
    return pathname === "/groups";
  }

  if (itemKey === "messages") {
    return pathname === "/messages";
  }

  if (itemKey === "notifications") {
    return pathname === "/notifications";
  }

  if (itemKey === "users") {
    return pathname === "/users" || pathname.startsWith("/users/");
  }

  if (itemKey === "profile") {
    return pathname === "/profile/me" || (pathname.startsWith("/post/") && sourceQuery === "profile");
  }

  return false;
}

function NavItem({ href, label, description, icon, pathname, itemKey, activeQuery, sourceQuery, modeQuery, badge }) {
  const isActive = isActivePath(pathname, itemKey, activeQuery, sourceQuery, modeQuery);

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl px-2 py-3 transition ${
        isActive
          ? "text-[#fe2c55]"
          : "text-white/82 hover:text-white"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-semibold">{label}</span>
      </span>
      {badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#fe2c55] px-1.5 text-[10px] font-bold text-white leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function LeftNavBar({
  pathname,
  currentUser,
  isLoggingOut,
  onLogout,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  activeQuery,
  sourceQuery,
  modeQuery,
  unreadNotificationCount,
  variant = "desktop",
  onClose,
  animationClassName = "",
}) {
  const isSearchActive = pathname === "/posts" && Boolean(activeQuery);
  const isMobile = variant === "mobile";
  const asideClassName = isMobile
    ? `theme-scrollbar fixed inset-y-0 left-0 z-50 flex w-[268px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#090909_0%,#050505_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] ${animationClassName}`
    : "theme-scrollbar fixed inset-y-0 left-0 z-30 hidden w-[268px] overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#090909_0%,#050505_100%)] px-5 py-6 text-white min-[1200px]:flex min-[1200px]:flex-col";

  return (
    <aside className={asideClassName} onClick={isMobile ? (event) => event.stopPropagation() : undefined}>
      {isMobile ? (
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <XIcon />
          </button>
        </div>
      ) : null}
      <Link href="/posts" className="px-2 py-3">
        <span className="block text-3xl font-black tracking-tight text-white">
          Tik<span className="text-[#fe2c55]">Pong</span>
        </span>
      </Link>

      {
        <form
          onSubmit={onSearchSubmit}
          className={`mt-4 rounded-full border px-4 py-3 transition ${
            isSearchActive
              ? "border-[#fe2c55]/60 bg-[#fe2c55]/10"
              : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <div
            className="flex items-center gap-2"
          >
            <span className={`shrink-0 ${isSearchActive ? "text-white" : "text-white/40"}`}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search posts"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={onSearchClear}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/15 hover:text-white"
                aria-label="Clear search"
              >
                <XIcon />
              </button>
            ) : null}
          </div>
        </form>
      }

      <nav className="mt-6 flex flex-col gap-3">
        <NavItem
          href="/posts"
          label="For You"
          description="Main posts feed"
          icon={<HomeIcon />}
          pathname={pathname}
          itemKey="for-you"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/posts?mode=explore"
          label="Explore"
          description="Search and discover posts"
          icon={<SearchIcon />}
          pathname={pathname}
          itemKey="explore"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/post/create-post"
          label="Upload"
          description="Create a new post"
          icon={<PlusIcon />}
          pathname={pathname}
          itemKey="upload"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/groups"
          label="Groups"
          description="Browse your communities"
          icon={<GroupIcon />}
          pathname={pathname}
          itemKey="groups"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/messages"
          label="Messages"
          description="Open your conversations"
          icon={<MessageIcon />}
          pathname={pathname}
          itemKey="messages"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/users"
          label="Users"
          description="Browse network members"
          icon={<UsersIcon />}
          pathname={pathname}
          itemKey="users"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
        <NavItem
          href="/notifications"
          label="Notifications"
          description="View your notifications"
          icon={<BellIcon />}
          pathname={pathname}
          itemKey="notifications"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
          badge={unreadNotificationCount}
        />
        <NavItem
          href="/profile/me"
          label="Profile"
          description="Open your profile"
          icon={currentUser ? renderSidebarAvatar(currentUser) : renderSidebarAvatar(null)}
          pathname={pathname}
          itemKey="profile"
          activeQuery={activeQuery}
          sourceQuery={sourceQuery}
          modeQuery={modeQuery}
        />
      </nav>

      {currentUser ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center rounded-2xl bg-[#fe2c55] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Register
            </Link>
          </div>
        </div>
      )}

    </aside>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNavClosing, setIsNavClosing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPulse, setNotificationPulse] = useState(null);
  const [isNotificationPulseLeaving, setIsNotificationPulseLeaving] = useState(false);
  const notifSocketRef = useRef(null);
  const lastNotificationPulseRef = useRef({ key: "", time: 0 });
  const navCloseTimeoutRef = useRef(null);

  const showNav = pathname && pathname !== "/" && !pathname.startsWith("/auth");
  const isMessagesRoute = pathname === "/messages";
  const isPostsRoute = pathname === "/posts";
  const hidesFloatingNavButton = isMessagesRoute || pathname === "/notifications";
  const activeQuery = searchParams.get("q") ?? "";
  const sourceQuery = searchParams.get("source") ?? "";
  const modeQuery = searchParams.get("mode") ?? "";

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  // Fetch initial unread notification count
  useEffect(() => {
    if (!showNav || !isAuthResolved || !currentUser?.id) {
      setUnreadCount(0);
      return;
    }

    let ignore = false;

    fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      credentials: "include",
    })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (!ignore && data?.success) {
          setUnreadCount(data.data?.count ?? 0);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [currentUser?.id, isAuthResolved, showNav]);

  // WebSocket: listen for notification:new to increment badge in real time
  useEffect(() => {
    if (!showNav || !isAuthResolved || !currentUser?.id) return;

    let disposed = false;
    let reconnectTimeoutId = null;

    function connect() {
      const wsUrl = buildWebSocketUrl(API_BASE_URL);
      if (!wsUrl) return;

      const socket = new WebSocket(wsUrl);
      notifSocketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "notification:new") {
            fetch(`${API_BASE_URL}/api/notifications/unread-count`, { credentials: "include" })
              .then((response) => response.json().catch(() => null))
              .then((payload) => {
                if (payload?.success) setUnreadCount(payload.data?.count ?? 0);
              })
              .catch(() => {});

            const nextNotification = msg.data || {};
            const nextKey = getRealtimeNotificationKey(nextNotification);
            const now = Date.now();
            const isRapidDuplicate =
              lastNotificationPulseRef.current.key === nextKey &&
              now - lastNotificationPulseRef.current.time < 10000;
            lastNotificationPulseRef.current = { key: nextKey, time: now };
            if (!isRapidDuplicate) {
              setNotificationPulse(nextNotification);
              setIsNotificationPulseLeaving(false);
            }
          } else if (msg.type === "user:status" && msg.data) {
            window.dispatchEvent(new CustomEvent("social:presence", { detail: msg.data }));
          }
        } catch {}
      };

      socket.onclose = () => {
        notifSocketRef.current = null;
        // Reconnect after 5s if still on the page
        reconnectTimeoutId = window.setTimeout(async () => {
          if (disposed || notifSocketRef.current !== null) return;
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" }).catch(() => null);
          if (response?.ok && !disposed) connect();
          else if (!disposed) setCurrentUser(null);
        }, 5000);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutId) window.clearTimeout(reconnectTimeoutId);
      const s = notifSocketRef.current;
      if (s) {
        s.onclose = null;
        s.close();
        notifSocketRef.current = null;
      }
    };
  }, [currentUser?.id, isAuthResolved, showNav]);

  // Reset badge when user visits the notifications page
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
      setNotificationPulse(null);
      setIsNotificationPulseLeaving(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!notificationPulse) {
      return;
    }

    const leaveTimeoutId = window.setTimeout(() => setIsNotificationPulseLeaving(true), 4400);
    const removeTimeoutId = window.setTimeout(() => {
      setNotificationPulse(null);
      setIsNotificationPulseLeaving(false);
    }, 4850);
    return () => {
      window.clearTimeout(leaveTimeoutId);
      window.clearTimeout(removeTimeoutId);
    };
  }, [notificationPulse]);

  useEffect(() => {
    function handleOpenNav() {
      if (navCloseTimeoutRef.current) window.clearTimeout(navCloseTimeoutRef.current);
      setIsNavClosing(false);
      setIsNavOpen(true);
    }

    window.addEventListener("app-shell:open-nav", handleOpenNav);

    return () => {
      window.removeEventListener("app-shell:open-nav", handleOpenNav);
    };
  }, []);

  useEffect(() => {
    if (navCloseTimeoutRef.current) window.clearTimeout(navCloseTimeoutRef.current);
    setIsNavClosing(false);
    setIsNavOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => () => {
    if (navCloseTimeoutRef.current) window.clearTimeout(navCloseTimeoutRef.current);
  }, []);

  function openNavigation() {
    if (navCloseTimeoutRef.current) window.clearTimeout(navCloseTimeoutRef.current);
    setIsNavClosing(false);
    setIsNavOpen(true);
  }

  function closeNavigation() {
    if (!isNavOpen || isNavClosing) return;
    setIsNavClosing(true);
    navCloseTimeoutRef.current = window.setTimeout(() => {
      setIsNavOpen(false);
      setIsNavClosing(false);
      navCloseTimeoutRef.current = null;
    }, 260);
  }

  useEffect(() => {
    if (!showNav) {
      setCurrentUser(null);
      setIsAuthResolved(true);
      return;
    }

    let ignore = false;
    setIsAuthResolved(false);

    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const payload = await response.json().catch(() => null);
        if (!ignore && response.ok && payload?.success) {
          setCurrentUser(payload.data ?? null);
        } else if (!ignore) {
          setCurrentUser(null);
        }
      } catch {
        if (!ignore) {
          setCurrentUser(null);
        }
      } finally {
        if (!ignore) setIsAuthResolved(true);
      }
    }

    fetchCurrentUser();

    return () => {
      ignore = true;
    };
  }, [showNav, pathname]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/api/auth/sessions`, {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      setCurrentUser(null);
      setIsLoggingOut(false);
      router.push("/auth/login");
      router.refresh();
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const trimmedQuery = searchInput.trim();
    const params = new URLSearchParams();

    if (modeQuery === "explore") {
      params.set("mode", "explore");
    }

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    const queryString = params.toString();
    router.push(queryString ? `/posts?${queryString}` : "/posts");
  }

  function handleSearchClear() {
    setSearchInput("");
    router.push(modeQuery === "explore" ? "/posts?mode=explore" : "/posts");
  }

  if (!showNav) {
    return children;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <button
        type="button"
        onClick={openNavigation}
        className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#161616]/92 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:bg-[#202020] min-[1200px]:hidden ${
          hidesFloatingNavButton ? "hidden" : isPostsRoute ? "left-4 top-20" : "left-4 top-4"
        }`}
        aria-label="Open navigation"
      >
        <MenuIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fe2c55] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {notificationPulse && unreadCount > 0 && !isNavOpen && !(isMessagesRoute && notificationPulse.type === "private_message") ? (
        <div className="notification-toast-viewport pointer-events-none fixed top-4 z-[70]">
          <Link
            key={getRealtimeNotificationKey(notificationPulse)}
            href="/notifications"
            className={`${isNotificationPulseLeaving ? "notification-toast-exit" : "notification-toast-enter"} notification-toast pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/12 bg-[#171717]/96 px-4 py-3 text-left text-sm text-white shadow-[0_20px_65px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-colors duration-300 hover:bg-[#202020]`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fe2c55]/15 text-[#ff6b89]">
              <NotificationTypeIcon type={notificationPulse.type} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#fe2c55]">New notification</span>
              <span className="mt-1 block truncate text-white/78">{notificationPulse.title || notificationPulse.message || "Open notifications"}</span>
            </span>
          </Link>
        </div>
      ) : null}

      {isNavOpen ? (
        <div
          className={`${isNavClosing ? "mobile-nav-backdrop-exit" : "mobile-nav-backdrop-enter"} fixed inset-0 z-40 bg-black/55 backdrop-blur-sm min-[1200px]:hidden`}
          onClick={closeNavigation}
        >
          <LeftNavBar
            pathname={pathname}
            currentUser={currentUser}
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            onSearchClear={handleSearchClear}
            activeQuery={activeQuery}
            sourceQuery={sourceQuery}
            modeQuery={modeQuery}
            unreadNotificationCount={unreadCount}
            variant="mobile"
            onClose={closeNavigation}
            animationClassName={isNavClosing ? "mobile-nav-panel-exit" : "mobile-nav-panel-enter"}
          />
        </div>
      ) : null}

      <LeftNavBar
        pathname={pathname}
        currentUser={currentUser}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        activeQuery={activeQuery}
        sourceQuery={sourceQuery}
        modeQuery={modeQuery}
        unreadNotificationCount={unreadCount}
      />
      <div className="min-[1200px]:pl-[268px]">{children}</div>
    </div>
  );
}
