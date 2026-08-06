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

function renderAvatar(avatarPath, label) {
  const normalizedPath = avatarPath?.trim();

  if (normalizedPath) {
    return (
      <img
        src={normalizeImagePath(normalizedPath)}
        alt={label}
        className="h-16 w-16 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-black">
      {getInitial(label)}
    </div>
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

function getDisplayName(user) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  if (user?.nickname) {
    return user.nickname;
  }

  return "User";
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
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      const hasPassedHero = currentScrollY > 220;

      if (hasPassedHero && isScrollingUp) {
        setShowFloatingSearch(true);
      } else if (currentScrollY <= 120 || !isScrollingUp) {
        setShowFloatingSearch(false);
      }

      lastScrollYRef.current = currentScrollY;
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          throw new Error(payload?.error || "Failed to load users");
        }

        if (!ignore) {
          setUsers(payload?.data?.users || []);
          setNextCursor(payload?.data?.next_cursor || "");
        }
      } catch (error) {
        if (!ignore) {
          setUsers([]);
          setNextCursor("");
          setErrorMessage(error.message || "Failed to load users");
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

    if (pendingFollowUserIds.includes(user.id)) {
      return;
    }

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
      setPendingFollowUserIds((currentIds) => currentIds.filter((id) => id !== user.id));
    }
  }

  function getFollowButtonLabel(user) {
    if (pendingFollowUserIds.includes(user.id)) {
      return "Working...";
    }

    if (requestedUserIds.includes(user.id)) {
      return "Requested";
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
        className={`pointer-events-none fixed left-4 right-4 top-4 z-30 transition duration-300 min-[1200px]:left-[288px] min-[1200px]:right-8 ${
          showFloatingSearch
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="w-full max-w-7xl">
          <form
            onSubmit={handleSearchSubmit}
            className="pointer-events-auto rounded-[26px] border border-white/10 bg-[#090909]/88 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search users by nickname or name"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <div className="grid grid-cols-2 gap-3 sm:flex sm:w-auto">
                <button
                  type="submit"
                  className="rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
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

            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-[28px] border border-white/10 bg-black/30 p-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search users by nickname or name"
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
                <div className="grid grid-cols-2 gap-3 sm:flex sm:w-auto">
                  <button
                    type="submit"
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[26px] border border-[#fe2c55]/30 bg-[#fe2c55]/10 px-5 py-4 text-sm text-[#ffd6df]">
            {errorMessage}
          </section>
        ) : null}

        {isLoading ? (
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
                  className="group flex flex-col items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-center transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {renderAvatar(user.avatar_path, displayName)}

                  <div className="w-full overflow-hidden">
                    <div className="flex min-w-0 items-center justify-center gap-2">
                      <h2 className="truncate text-base font-semibold text-white">{displayName}</h2>
                      {isPrivateAccount(user) ? (
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/65"
                          title="Private account"
                          aria-label="Private account"
                        >
                          <LockIcon />
                        </span>
                      ) : null}
                    </div>
                    {user.nickname && getDisplayName(user) !== user.nickname ? (
                      <p className="truncate text-xs text-white/45">@{user.nickname}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => handleFollowAction(event, user)}
                    disabled={pendingFollowUserIds.includes(user.id)}
                    className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      requestedUserIds.includes(user.id)
                        ? "border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.1]"
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
