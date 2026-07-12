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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M17.5 19a5.5 5.5 0 0 0-11 0M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  if (user?.nickname) {
    return user.nickname;
  }

  return "Guest";
}

function renderSidebarAvatar(user, sizeClassName = "h-11 w-11") {
  if (user?.avatar_path) {
    return (
      <img
        src={normalizeImagePath(user.avatar_path)}
        alt={getDisplayName(user)}
        className={`${sizeClassName} rounded-2xl object-cover`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black ${sizeClassName}`}>
      {getInitial(user?.nickname || user?.first_name || "Guest")}
    </div>
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
      className={`group flex items-center gap-4 rounded-[22px] border px-4 py-3 transition ${
        isActive
          ? "border-[#fe2c55]/60 bg-[#fe2c55]/12 text-white"
          : "border-white/10 bg-white/[0.03] text-white/72 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-white/40 transition group-hover:text-white/55">
          {description}
        </span>
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
}) {
  const isSearchActive = pathname === "/posts" && Boolean(activeQuery);
  const isMobile = variant === "mobile";
  const asideClassName = isMobile
    ? "theme-scrollbar fixed inset-y-0 left-0 z-50 flex w-[268px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#090909_0%,#050505_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    : "theme-scrollbar fixed inset-y-0 left-0 z-30 hidden w-[268px] overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#090909_0%,#050505_100%)] px-5 py-6 text-white min-[1200px]:flex min-[1200px]:flex-col";

  return (
    <aside className={asideClassName}>
      {isMobile ? (
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      ) : null}
      <Link href="/posts" className="rounded-[26px] border border-white/10 bg-white/[0.03] px-4 py-4">
        <span className="block text-[11px] uppercase tracking-[0.4em] text-white/40">Social</span>
        <span className="mt-1 block text-3xl font-semibold tracking-tight text-white">Network</span>
      </Link>

      {
        <form
          onSubmit={onSearchSubmit}
          className={`mt-4 rounded-[30px] border p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur transition ${
            isSearchActive
              ? "border-[#fe2c55]/60 bg-[#fe2c55]/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-3 transition ${
              isSearchActive
                ? "border-[#fe2c55]/45 bg-[#fe2c55]/12"
                : "border-white/10 bg-white/[0.08]"
            }`}
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
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="submit"
              className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onSearchClear}
              className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Clear
            </button>
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
          icon={
            currentUser
              ? renderSidebarAvatar(currentUser)
              : (
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    isActivePath(pathname, "profile", activeQuery, sourceQuery, modeQuery)
                      ? "bg-[#fe2c55] text-white"
                      : "bg-white/[0.06] text-white/80"
                  }`}
                >
                  <UserIcon />
                </span>
              )
          }
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const notifSocketRef = useRef(null);

  const showNav = pathname && pathname !== "/" && !pathname.startsWith("/auth");
  const isMessagesRoute = pathname === "/messages";
  const activeQuery = searchParams.get("q") ?? "";
  const sourceQuery = searchParams.get("source") ?? "";
  const modeQuery = searchParams.get("mode") ?? "";

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  // Fetch initial unread notification count
  useEffect(() => {
    if (!showNav) {
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
  }, [showNav]);

  // WebSocket: listen for notification:new to increment badge in real time
  useEffect(() => {
    if (!showNav) return;

    function connect() {
      const wsUrl = buildWebSocketUrl(API_BASE_URL);
      if (!wsUrl) return;

      const socket = new WebSocket(wsUrl);
      notifSocketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "notification:new") {
            setUnreadCount((prev) => prev + 1);
          }
        } catch {}
      };

      socket.onclose = () => {
        notifSocketRef.current = null;
        // Reconnect after 5s if still on the page
        setTimeout(() => {
          if (notifSocketRef.current === null) connect();
        }, 5000);
      };
    }

    connect();

    return () => {
      const s = notifSocketRef.current;
      if (s) {
        s.onclose = null;
        s.close();
        notifSocketRef.current = null;
      }
    };
  }, [showNav]);

  // Reset badge when user visits the notifications page
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    function handleOpenNav() {
      setIsNavOpen(true);
    }

    window.addEventListener("app-shell:open-nav", handleOpenNav);

    return () => {
      window.removeEventListener("app-shell:open-nav", handleOpenNav);
    };
  }, []);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!showNav) {
      setCurrentUser(null);
      return;
    }

    let ignore = false;

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
        onClick={() => setIsNavOpen(true)}
        className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#161616]/92 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:bg-[#202020] min-[1200px]:hidden ${
          isMessagesRoute ? "hidden" : "left-4 top-4"
        }`}
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      {isNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm min-[1200px]:hidden"
          onClick={() => setIsNavOpen(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>
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
              onClose={() => setIsNavOpen(false)}
            />
          </div>
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