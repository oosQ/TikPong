"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getInitial, normalizeImagePath } from "@/app/posts/_components/post-card";

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

function UserAvatar({ avatarPath, label }) {
  const [hasImageError, setHasImageError] = useState(false);
  const normalizedPath = avatarPath?.trim();

  if (normalizedPath && !hasImageError) {
    return (
      <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px] shadow-[0_14px_38px_rgba(0,0,0,0.35)]">
        <img
          src={normalizeImagePath(normalizedPath)}
          alt={label}
          onError={() => setHasImageError(true)}
          className="h-24 w-24 rounded-full border-4 border-black object-cover"
        />
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#fe2c55,#25f4ee)] p-[2px] shadow-[0_14px_38px_rgba(0,0,0,0.35)]">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-semibold text-black">
        {getInitial(label)}
      </div>
    </span>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M7.5 10V8.2a4.5 4.5 0 0 1 9 0V10M6.8 10h10.4A1.8 1.8 0 0 1 19 11.8v6.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 18.2v-6.4A1.8 1.8 0 0 1 6.8 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoginRequiredState() {
  return (
    <section className="flex min-h-[52vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Log in to browse users</h2>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Sign in to discover people, search profiles, and send follow requests.
        </p>
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

  return `User ${String(user?.id || "").replace(/-/g, "").slice(0, 6) || "profile"}`;
}

function getUserHandle(user) {
  const nickname = String(user?.nickname || "").trim();
  if (nickname) {
    return `@${nickname}`;
  }

  return `@user${String(user?.id || "").replace(/-/g, "").slice(0, 8) || "profile"}`;
}

function needsProfileHydration(user) {
  const hasFirstName = String(user?.first_name ?? user?.firstName ?? "").trim();
  const hasLastName = String(user?.last_name ?? user?.lastName ?? "").trim();
  return Boolean(user?.id) && !hasFirstName && !hasLastName;
}

function isPrivateAccount(user) {
  const value = user?.is_public;

  if (typeof value === "boolean") {
    return !value;
  }

  if (typeof value === "number") {
    return value === 0;
  }

  if (typeof value === "string") {
    return ["0", "false", "private"].includes(value.trim().toLowerCase());
  }

  return false;
}

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeQuery = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(activeQuery);
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingFollowUserIds, setPendingFollowUserIds] = useState([]);
  const [requestedUserIds, setRequestedUserIds] = useState([]);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [isFloatingSearchFocused, setIsFloatingSearchFocused] = useState(false);
  const lastScrollYRef = useRef(0);
  const pendingFollowUserIdsRef = useRef(new Set());

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    const trimmedQuery = searchInput.trim();

    if (trimmedQuery === activeQuery.trim()) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();

      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeQuery, pathname, router, searchInput]);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;
      const hasPassedHero = currentScrollY > 220;

      if (hasPassedHero && isScrollingDown) {
        setShowFloatingSearch(true);
      } else if (!isFloatingSearchFocused && (currentScrollY <= 120 || !isScrollingDown)) {
        setShowFloatingSearch(false);
      }

      lastScrollYRef.current = currentScrollY;
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFloatingSearchFocused]);

  useEffect(() => {
    let ignore = false;

    async function fetchUsers() {
      setIsLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams({ limit: "24" });
      const trimmedQuery = activeQuery.trim();
      const endpoint = trimmedQuery ? "/api/users/search" : "/api/users";

      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const payload = await parseResponse(response);

        if (!response.ok || !payload?.success) {
          const error = new Error(payload?.error || "Failed to load users");
          error.status = response.status;
          throw error;
        }

        if (!ignore) {
          setUsers(payload?.data?.users || []);
          setNextCursor(payload?.data?.next_cursor || "");
        }
      } catch (error) {
        if (!ignore) {
          setUsers([]);
          setNextCursor("");
          const isUnauthorized = error?.status === 401 || /unauthorized|login/i.test(error?.message || "");
          setErrorMessage(isUnauthorized ? "AUTH_REQUIRED" : error.message || "Failed to load users");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, [activeQuery]);

  useEffect(() => {
    const usersToHydrate = users.filter(needsProfileHydration).slice(0, 12);
    if (!usersToHydrate.length) {
      return undefined;
    }

    let ignore = false;

    async function hydrateUsers() {
      const hydratedUsers = await Promise.all(
        usersToHydrate.map(async (user) => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
              method: "GET",
              credentials: "include",
            });
            const payload = await parseResponse(response);

            if (!response.ok || !payload?.success || !payload?.data) {
              return null;
            }

            return {
              id: user.id,
              first_name: payload.data.first_name || "",
              last_name: payload.data.last_name || "",
              nickname: payload.data.nickname || user.nickname || "",
              avatar_path: payload.data.avatar_path || user.avatar_path || "",
            };
          } catch {
            return null;
          }
        })
      );

      if (ignore) {
        return;
      }

      const hydratedById = new Map(hydratedUsers.filter(Boolean).map((user) => [user.id, user]));
      if (!hydratedById.size) {
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          hydratedById.has(user.id) ? { ...user, ...hydratedById.get(user.id) } : user
        )
      );
    }

    hydrateUsers();

    return () => {
      ignore = true;
    };
  }, [users]);

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setErrorMessage("");

    const params = new URLSearchParams({
      limit: "24",
      cursor: nextCursor,
    });
    const trimmedQuery = activeQuery.trim();
    const endpoint = trimmedQuery ? "/api/users/search" : "/api/users";

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load more users");
      }

      const nextUsers = payload?.data?.users || [];

      setUsers((currentUsers) => {
        const seenIds = new Set(currentUsers.map((user) => user.id));
        const mergedUsers = [...currentUsers];

        nextUsers.forEach((user) => {
          if (!seenIds.has(user.id)) {
            seenIds.add(user.id);
            mergedUsers.push(user);
          }
        });

        return mergedUsers;
      });
      setNextCursor(payload?.data?.next_cursor || "");
    } catch (error) {
      setErrorMessage(error.message || "Failed to load more users");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleFollowAction(event, user) {
    event.preventDefault();
    event.stopPropagation();

    if (!user?.id) {
      return;
    }

    if (pendingFollowUserIdsRef.current.has(user.id)) {
      return;
    }

    pendingFollowUserIdsRef.current.add(user.id);
    setPendingFollowUserIds((currentIds) => [...currentIds, user.id]);
    setErrorMessage("");

    try {
      if (requestedUserIds.includes(user.id)) {
        const cancelResponse = await fetch(`${API_BASE_URL}/api/follow-requests/${user.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const cancelPayload = await parseResponse(cancelResponse);

        if (!cancelResponse.ok || !cancelPayload?.success) {
          throw new Error(cancelPayload?.error || "Failed to cancel follow request");
        }

        setRequestedUserIds((currentIds) => currentIds.filter((id) => id !== user.id));
        return;
      }

      if (Number(user.is_following) === 1) {
        const unfollowResponse = await fetch(`${API_BASE_URL}/api/follows/${user.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const unfollowPayload = await parseResponse(unfollowResponse);

        if (!unfollowResponse.ok || !unfollowPayload?.success) {
          throw new Error(unfollowPayload?.error || "Failed to unfollow user");
        }

        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser.id === user.id
              ? { ...currentUser, is_following: 0 }
              : currentUser
          )
        );
        return;
      }

      const followResponse = await fetch(`${API_BASE_URL}/api/follows/${user.id}`, {
        method: "POST",
        credentials: "include",
      });
      const followPayload = await parseResponse(followResponse);

      if (followResponse.ok && followPayload?.success) {
        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser.id === user.id
              ? { ...currentUser, is_following: 1 }
              : currentUser
          )
        );
        return;
      }

      const followError = String(followPayload?.error || "").toLowerCase();
      const shouldSendRequest =
        followResponse.status === 400 &&
        followError.includes("private") &&
        followError.includes("follow request");

      if (!shouldSendRequest) {
        if (followResponse.status === 401) {
          router.push("/auth/login");
          return;
        }

        throw new Error(followPayload?.error || "Failed to follow user");
      }

      const requestResponse = await fetch(`${API_BASE_URL}/api/follow-requests/${user.id}`, {
        method: "POST",
        credentials: "include",
      });
      const requestPayload = await parseResponse(requestResponse);

      if (!requestResponse.ok || !requestPayload?.success) {
        if (requestResponse.status === 401) {
          router.push("/auth/login");
          return;
        }

        throw new Error(requestPayload?.error || "Failed to send follow request");
      }

      setRequestedUserIds((currentIds) =>
        currentIds.includes(user.id) ? currentIds : [...currentIds, user.id]
      );
    } catch (error) {
      setErrorMessage(error.message || "Failed to update follow status");
    } finally {
      pendingFollowUserIdsRef.current.delete(user.id);
      setPendingFollowUserIds((currentIds) => currentIds.filter((id) => id !== user.id));
    }
  }

  function getFollowButtonLabel(user) {
    if (pendingFollowUserIds.includes(user.id)) {
      return "Working...";
    }

    if (requestedUserIds.includes(user.id)) {
      return "Follow request pending";
    }

    if (Number(user.is_following) === 1) {
      return "Following";
    }

    return "Follow";
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const trimmedQuery = searchInput.trim();
    const params = new URLSearchParams();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSearchClear() {
    setSearchInput("");
    router.push(pathname);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#171717_0%,#060606_48%,#020202_100%)] px-4 pb-16 pt-20 text-white min-[1200px]:pl-[288px] min-[1200px]:pr-8 min-[1200px]:pt-8">
      <div
        className={`pointer-events-none fixed left-4 right-4 top-16 z-30 transition duration-300 min-[1200px]:left-[288px] min-[1200px]:right-8 min-[1200px]:top-4 ${
          showFloatingSearch || isFloatingSearchFocused ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="w-full max-w-7xl">
          <form
            onSubmit={handleSearchSubmit}
            className="pointer-events-auto rounded-full border border-white/10 bg-[#090909]/88 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onFocus={() => {
                  setIsFloatingSearchFocused(true);
                  setShowFloatingSearch(true);
                }}
                onBlur={() => {
                  setIsFloatingSearchFocused(false);
                  if (window.scrollY <= 120) {
                    setShowFloatingSearch(false);
                  }
                }}
                placeholder="Search users by nickname or name"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/15 hover:text-white"
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/40">Community</span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Users</h1>
            </div>

            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-full border border-white/10 bg-black/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search users by nickname or name"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/15 hover:text-white"
                    aria-label="Clear search"
                  >
                    <ClearIcon />
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        {errorMessage === "AUTH_REQUIRED" ? (
          <LoginRequiredState />
        ) : errorMessage ? (
          <section className="rounded-[26px] border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-5 py-4 text-sm text-[#ffd6df]">
            {errorMessage}
          </section>
        ) : null}

        {errorMessage ? null : isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]"
              />
            ))}
          </section>
        ) : users.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {users.map((user) => {
              const displayName = getDisplayName(user);

              return (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="group relative flex min-w-0 flex-col items-center gap-4 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-center transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {isPrivateAccount(user) ? (
                    <span
                      className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/70 backdrop-blur"
                      title="Private account"
                      aria-label="Private account"
                    >
                      <LockIcon />
                    </span>
                  ) : null}
                  <div className="flex h-24 w-full items-center justify-center">
                    <UserAvatar avatarPath={user.avatar_path} label={displayName} />
                  </div>

                  <div className="w-full min-w-0 overflow-hidden px-1">
                    <div className="flex min-w-0 items-center justify-center gap-2">
                      <h2 className="truncate text-base font-semibold text-white">{displayName}</h2>
                    </div>
                    <p className="truncate text-xs text-white/45">{getUserHandle(user)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => handleFollowAction(event, user)}
                    disabled={pendingFollowUserIds.includes(user.id)}
                    className={`w-full max-w-full rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      requestedUserIds.includes(user.id)
                        ? "border border-amber-300/35 bg-amber-300/12 text-amber-100 hover:bg-amber-300/18"
                        : Number(user.is_following) === 1
                          ? "border border-[#fe2c55]/35 bg-[#fe2c55]/12 text-white hover:bg-[#fe2c55]/18"
                          : "bg-[#fe2c55] text-white hover:bg-[#e0264b]"
                    }`}
                  >
                    {getFollowButtonLabel(user)}
                  </button>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-white">No users found</h2>
            <p className="mt-2 text-sm text-white/50">
              {activeQuery.trim() ? "Try a different search term." : "There are no visible users to show yet."}
            </p>
          </section>
        )}

        {!isLoading && nextCursor ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Load more users"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
