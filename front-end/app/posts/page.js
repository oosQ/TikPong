"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FeedPostCard,
  formatCount,
  getInitial,
  normalizeImagePath,
} from "@/app/posts/_components/post-card";
import PostEditModal from "@/app/posts/_components/post-edit-modal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

function renderUserAvatar(avatarPath, label, sizeClassName) {
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

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8 14 2.8-2.8a1 1 0 0 1 1.4 0L16 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.5" cy="9.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="m4 12 16-8-5 16-3-6-8-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12 14 8-10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function LoginRequiredState() {
  return (
    <div className="flex min-h-[78vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Log in to explore</h2>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Sign in to explore posts, hashtags, and activity from the community.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white/90"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

export default function PostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedScrollRef = useRef(null);
  const loadMoreRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const pendingViewTimeoutsRef = useRef(new Map());
  const viewedPostIdsRef = useRef(new Set());
  const commentVisibilityRatiosRef = useRef(new Map());
  const pendingFollowUserIdsRef = useRef(new Set());

  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [exploreHashtags, setExploreHashtags] = useState([]);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [pendingLikePostIds, setPendingLikePostIds] = useState([]);
  const [pendingRepostPostIds, setPendingRepostPostIds] = useState([]);
  const [pendingFollowUserIds, setPendingFollowUserIds] = useState([]);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState("");
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState("");
  const [commentsErrorMessage, setCommentsErrorMessage] = useState("");
  const [commentDraftByPostId, setCommentDraftByPostId] = useState({});
  const [commentImageByPostId, setCommentImageByPostId] = useState({});
  const [commentSubmittingPostId, setCommentSubmittingPostId] = useState("");
  const [openCommentMenuId, setOpenCommentMenuId] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [isEditPostSubmitting, setIsEditPostSubmitting] = useState(false);
  const [editPostErrorMessage, setEditPostErrorMessage] = useState("");
  const [loadingEditPostId, setLoadingEditPostId] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");
  const [blockingUserId, setBlockingUserId] = useState("");
  const [selectedExplorePostId, setSelectedExplorePostId] = useState("");

  const activeQuery = searchParams.get("q") ?? "";
  const activeMode = searchParams.get("mode") ?? "";
  const feedRequestKey = `${activeMode}::${activeQuery}`;
  const isExploreMode = activeMode === "explore";

  async function loadPosts(cursor = "", queryValue = activeQuery, modeValue = activeMode) {
    const query = new URLSearchParams({ limit: "20" });
    const trimmedQuery = queryValue.trim();
    const isExploreMode = modeValue === "explore";

    if (cursor) {
      query.set("cursor", cursor);
    }

    if (isExploreMode) {
      query.set("mode", "explore");
    }

    if (trimmedQuery) {
      query.set("q", trimmedQuery);
    }

    const endpoint = trimmedQuery ? "/api/posts/search" : isExploreMode ? "/api/posts/explore" : "/api/posts";
    const response = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    const payload = await parseResponse(response);
    if (!response.ok || !payload?.success) {
      if (response.status === 401 && isExploreMode) {
        const error = new Error("You need to log in to explore posts.");
        error.status = response.status;
        throw error;
      }
      throw new Error(payload?.error || "Failed to load posts");
    }

    return payload.data;
  }

  async function loadPostDetail(postId) {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
      method: "GET",
      credentials: "include",
    });

    const payload = await parseResponse(response);
    if (!response.ok || !payload?.success || !payload?.data) {
      throw new Error(payload?.error || "Failed to load post details");
    }

    return payload.data;
  }

  async function sendPostView(postId) {
    if (!currentUser || !postId || viewedPostIdsRef.current.has(postId)) {
      return;
    }

    viewedPostIdsRef.current.add(postId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/view`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to create post view");
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === postId
            ? { ...item, total_views: Number(item.total_views || 0) + 1 }
            : item
        )
      );
    } catch {
      viewedPostIdsRef.current.delete(postId);
    }
  }

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    setSelectedExplorePostId("");
    setActiveCommentsPostId("");
    setCommentsErrorMessage("");
  }, [feedRequestKey]);

  useEffect(() => {
    if (!isExploreMode) {
      setExploreHashtags([]);
      return undefined;
    }

    let ignore = false;

    async function fetchExploreHashtags() {
      setHashtagsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/hashtags?limit=20`, {
          method: "GET",
          credentials: "include",
        });
        const payload = await parseResponse(response);

        if (!ignore && response.ok && payload?.success) {
          setExploreHashtags(payload?.data?.hashtags || []);
        }
      } catch {
        if (!ignore) {
          setExploreHashtags([]);
        }
      } finally {
        if (!ignore) {
          setHashtagsLoading(false);
        }
      }
    }

    fetchExploreHashtags();

    return () => {
      ignore = true;
    };
  }, [isExploreMode]);

  useEffect(() => {
    let ignore = false;

    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const payload = await parseResponse(response);
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

    async function fetchInitialPosts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [data] = await Promise.all([loadPosts("", activeQuery, activeMode), fetchCurrentUser()]);
        if (!ignore) {
          setPosts(data?.posts || []);
          setNextCursor(data?.next_cursor || "");
        }
      } catch (error) {
        if (!ignore) {
          setPosts([]);
          setNextCursor("");
          setErrorMessage(error?.status === 401 && activeMode === "explore" ? "AUTH_REQUIRED" : error.message || "Failed to load posts");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchInitialPosts();

    return () => {
      ignore = true;
    };
  }, [feedRequestKey]);

  useEffect(() => {
    if (!feedScrollRef.current || !loadMoreRef.current || isLoading || isLoadingMore || !nextCursor) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { root: feedScrollRef.current, rootMargin: "1200px 0px" }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, isLoadingMore, nextCursor, feedRequestKey]);

  useEffect(() => {
    if (!selectedExplorePostId || !feedScrollRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      const selectedPost = feedScrollRef.current?.querySelector(`[data-post-id="${selectedExplorePostId}"]`);
      selectedPost?.scrollIntoView({ block: "start" });
    });
  }, [selectedExplorePostId]);

  useEffect(() => {
    if (!feedScrollRef.current || !currentUser || posts.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const postId = target.dataset.postId;
          if (!postId || viewedPostIdsRef.current.has(postId)) {
            return;
          }

          const existingTimeout = pendingViewTimeoutsRef.current.get(postId);

          if (entry.isIntersecting) {
            if (existingTimeout) {
              return;
            }

            const timeoutId = window.setTimeout(() => {
              pendingViewTimeoutsRef.current.delete(postId);
              void sendPostView(postId);
            }, 2000);

            pendingViewTimeoutsRef.current.set(postId, timeoutId);
            return;
          }

          if (existingTimeout) {
            window.clearTimeout(existingTimeout);
            pendingViewTimeoutsRef.current.delete(postId);
          }
        });
      },
      {
        root: feedScrollRef.current,
        threshold: 0.7,
      }
    );

    const postElements = feedScrollRef.current.querySelectorAll("[data-post-id]");
    postElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      pendingViewTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      pendingViewTimeoutsRef.current.clear();
    };
  }, [currentUser, posts]);

  useEffect(() => {
    if (!feedScrollRef.current || !activeCommentsPostId || posts.length === 0) {
      commentVisibilityRatiosRef.current.clear();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const targetPostId = target.dataset.postId;
          if (!targetPostId) {
            return;
          }

          commentVisibilityRatiosRef.current.set(targetPostId, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let nextPostId = "";
        let nextRatio = 0;

        commentVisibilityRatiosRef.current.forEach((ratio, targetPostId) => {
          if (ratio > nextRatio) {
            nextRatio = ratio;
            nextPostId = targetPostId;
          }
        });

        if (!nextPostId || nextPostId === activeCommentsPostId) {
          return;
        }

        setActiveCommentsPostId(nextPostId);
        if (!commentsByPostId[nextPostId]) {
          void fetchComments(nextPostId);
        } else {
          setCommentsErrorMessage("");
        }
      },
      {
        root: feedScrollRef.current,
        threshold: [0.4, 0.6, 0.8],
      }
    );

    const postElements = feedScrollRef.current.querySelectorAll("[data-post-id]");
    postElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      commentVisibilityRatiosRef.current.clear();
    };
  }, [activeCommentsPostId, posts, commentsByPostId]);

  useEffect(() => {
    if (!openCommentMenuId) {
      return undefined;
    }

    function handlePointerDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-comment-menu]") || target.closest("[data-comment-menu-trigger]")) {
        return;
      }

      setOpenCommentMenuId("");
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [openCommentMenuId]);

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setErrorMessage("");

    try {
      const data = await loadPosts(nextCursor, activeQuery, activeMode);
      setPosts((currentPosts) => [...currentPosts, ...(data?.posts || [])]);
      setNextCursor(data?.next_cursor || "");
    } catch (error) {
      setErrorMessage(error.message || "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleClearSearch() {
    setSearchInput("");
    router.replace(pathname);
  }

  function handleHashtagClick(hashtagName) {
    const normalizedHashtagName = String(hashtagName || "").trim();
    if (!normalizedHashtagName) {
      setErrorMessage("Hashtag not found");
      return;
    }

    router.push(`/hashtags/${encodeURIComponent(normalizedHashtagName)}`);
  }

  function renderExploreHashtags() {
    if (!isExploreMode) {
      return null;
    }

    return (
      <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-black/92 px-4 py-3 backdrop-blur xl:-mx-8 xl:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {hashtagsLoading && exploreHashtags.length === 0 ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/45">
              Loading hashtags...
            </span>
          ) : null}
          {exploreHashtags.map((hashtag) => {
            const name = hashtag.name || hashtag.hashtag || "";
            if (!name) {
              return null;
            }

            return (
              <button
                key={hashtag.id || name}
                type="button"
                onClick={() => handleHashtagClick(name)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[#fe2c55]/60 hover:bg-[#fe2c55]/14 hover:text-white"
              >
                #{name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderExploreGrid() {
    if (!isExploreMode || selectedExplorePostId || isLoading || errorMessage || posts.length === 0) {
      return null;
    }

    return (
      <div className="mx-auto max-w-6xl px-0 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedExplorePostId(post.id)}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#101010] text-left transition hover:border-white/25"
            >
              {post.image_path ? (
                <img
                  src={normalizeImagePath(post.image_path)}
                  alt={post.title || post.nickname || "Post"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(254,44,85,0.28),transparent_42%),#101010] px-4 text-center">
                  <p className="line-clamp-6 text-sm font-semibold leading-6 text-white/88">
                    {post.content || post.title || "Post"}
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                <p className="truncate text-sm font-semibold text-white">{post.title || post.nickname || "Post"}</p>
                <p className="mt-1 truncate text-xs text-white/55">@{post.nickname || post.user_id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  async function handleToggleLike(post) {
    if (!currentUser) {
      setErrorMessage("Login first to like posts");
      router.push("/auth/login");
      return;
    }

    const postId = post.id;
    const isLiked = Number(post.is_liked) === 1;

    if (pendingLikePostIds.includes(postId)) {
      return;
    }

    setPendingLikePostIds((current) => [...current, postId]);
    setErrorMessage("");

    setPosts((currentPosts) =>
      currentPosts.map((item) => {
        if (item.id !== postId) {
          return item;
        }

        const nextTotalLikes = isLiked
          ? Math.max(0, Number(item.total_likes || 0) - 1)
          : Number(item.total_likes || 0) + 1;

        return {
          ...item,
          is_liked: isLiked ? 0 : 1,
          total_likes: nextTotalLikes,
        };
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update like");
      }
    } catch (error) {
      setPosts((currentPosts) =>
        currentPosts.map((item) => {
          if (item.id !== postId) {
            return item;
          }

          return {
            ...item,
            is_liked: isLiked ? 1 : 0,
            total_likes: Number(post.total_likes || 0),
          };
        })
      );
      setErrorMessage(error.message || "Failed to update like");
    } finally {
      setPendingLikePostIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function handleToggleRepost(post) {
    if (!currentUser) {
      setErrorMessage("Login first to repost posts");
      router.push("/auth/login");
      return;
    }

    const postId = post.id;
    const isReposted = Number(post.is_reposted) === 1;

    if (pendingRepostPostIds.includes(postId)) {
      return;
    }

    setPendingRepostPostIds((current) => [...current, postId]);
    setErrorMessage("");

    setPosts((currentPosts) =>
      currentPosts.map((item) => {
        if (item.id !== postId) {
          return item;
        }

        const nextTotalReposts = isReposted
          ? Math.max(0, Number(item.total_reposts || 0) - 1)
          : Number(item.total_reposts || 0) + 1;

        return {
          ...item,
          is_reposted: isReposted ? 0 : 1,
          total_reposts: nextTotalReposts,
        };
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/repost`, {
        method: isReposted ? "DELETE" : "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update repost");
      }
    } catch (error) {
      setPosts((currentPosts) =>
        currentPosts.map((item) => {
          if (item.id !== postId) {
            return item;
          }

          return {
            ...item,
            is_reposted: isReposted ? 1 : 0,
            total_reposts: Number(post.total_reposts || 0),
          };
        })
      );
      setErrorMessage(error.message || "Failed to update repost");
    } finally {
      setPendingRepostPostIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function handleFollowPostUser(post) {
    if (!currentUser) {
      setErrorMessage("Login first to follow users");
      router.push("/auth/login");
      return;
    }

    if (!post?.user_id || post.user_id === currentUser.id || pendingFollowUserIdsRef.current.has(post.user_id)) {
      return;
    }

    const userId = post.user_id;
    pendingFollowUserIdsRef.current.add(userId);
    setPendingFollowUserIds((current) => [...current, userId]);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/follows/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }

        throw new Error(payload?.error || "Failed to follow user");
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.user_id === userId ? { ...item, is_following: 1 } : item
        )
      );
    } catch (error) {
      setErrorMessage(error.message || "Failed to follow user");
    } finally {
      pendingFollowUserIdsRef.current.delete(userId);
      setPendingFollowUserIds((current) => current.filter((id) => id !== userId));
    }
  }

  async function fetchComments(postId) {
    setCommentsLoadingPostId(postId);
    setCommentsErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments?limit=50`, {
        method: "GET",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load comments");
      }

      setCommentsByPostId((current) => ({
        ...current,
        [postId]: payload?.data?.comments || [],
      }));
    } catch (error) {
      setCommentsErrorMessage(error.message || "Failed to load comments");
    } finally {
      setCommentsLoadingPostId("");
    }
  }

  async function handleCommentsToggle(post) {
    if (activeCommentsPostId === post.id) {
      setActiveCommentsPostId("");
      setCommentsErrorMessage("");
      return;
    }

    setActiveCommentsPostId(post.id);
    if (!commentsByPostId[post.id]) {
      await fetchComments(post.id);
    } else {
      setCommentsErrorMessage("");
    }
  }

  async function handleCreateComment() {
    if (!activeCommentsPostId) {
      return;
    }

    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    const content = (commentDraftByPostId[activeCommentsPostId] || "").trim();
    const selectedImage = commentImageByPostId[activeCommentsPostId] || null;
    if (!content) {
      setCommentsErrorMessage("Comment content is required");
      return;
    }

    setCommentSubmittingPostId(activeCommentsPostId);
    setCommentsErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (selectedImage) {
        formData.append("image_path", selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/${activeCommentsPostId}/comments`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to create comment");
      }

      setCommentDraftByPostId((current) => ({
        ...current,
        [activeCommentsPostId]: "",
      }));
      setCommentImageByPostId((current) => ({
        ...current,
        [activeCommentsPostId]: null,
      }));
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === activeCommentsPostId
            ? { ...post, total_comments: Number(post.total_comments || 0) + 1 }
            : post
        )
      );
      await fetchComments(activeCommentsPostId);
    } catch (error) {
      setCommentsErrorMessage(error.message || "Failed to create comment");
    } finally {
      setCommentSubmittingPostId("");
    }
  }

  async function handleDeleteComment(comment) {
    if (!currentUser || currentUser.id !== comment.user_id) {
      return;
    }

    setDeletingCommentId(comment.id);
    setCommentsErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to delete comment");
      }

      setCommentsByPostId((current) => ({
        ...current,
        [activeCommentsPostId]: (current[activeCommentsPostId] || []).filter(
          (item) => item.id !== comment.id
        ),
      }));
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === activeCommentsPostId
            ? {
                ...post,
                total_comments: Math.max(0, Number(post.total_comments || 0) - 1),
              }
            : post
        )
      );
      setOpenCommentMenuId("");
    } catch (error) {
      setCommentsErrorMessage(error.message || "Failed to delete comment");
    } finally {
      setDeletingCommentId("");
    }
  }

  async function handleOpenEditPost(post) {
    if (!currentUser || currentUser.id !== post.user_id || loadingEditPostId) {
      return;
    }

    setLoadingEditPostId(post.id);
    setEditPostErrorMessage("");
    setErrorMessage("");

    try {
      const detail = await loadPostDetail(post.id);
      setEditingPost(detail);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load post details");
    } finally {
      setLoadingEditPostId("");
    }
  }

  async function handleSubmitEditPost(formValues) {
    if (!editingPost) {
      return;
    }

    setIsEditPostSubmitting(true);
    setEditPostErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("content", formValues.content);
      formData.append("privacy", formValues.privacy);
      formData.append("image_path", formValues.imagePath || "");
      formValues.hashtags.forEach((hashtag) => formData.append("hashtags", hashtag));
      formValues.allowedViewers.forEach((viewerId) => formData.append("allowed_viewers", viewerId));
      if (formValues.image) {
        formData.append("image_path", formValues.image);
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/${editingPost.id}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update post");
      }

      const updatedDetail = await loadPostDetail(editingPost.id);
      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === editingPost.id
            ? {
                ...item,
                title: updatedDetail.title,
                content: updatedDetail.content,
                privacy: updatedDetail.privacy,
                image_path: updatedDetail.image_path,
                hashtags: updatedDetail.hashtags,
                is_edited: updatedDetail.is_edited,
              }
            : item
        )
      );
      setEditingPost(null);
    } catch (error) {
      setEditPostErrorMessage(error.message || "Failed to update post");
    } finally {
      setIsEditPostSubmitting(false);
    }
  }

  async function handleDeletePost(post) {
    if (!currentUser || currentUser.id !== post.user_id || deletingPostId) {
      return;
    }

    if (!window.confirm("Delete this post?")) {
      return;
    }

    setDeletingPostId(post.id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to delete post");
      }

      setPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id));
      if (activeCommentsPostId === post.id) {
        setActiveCommentsPostId("");
        setCommentsErrorMessage("");
      }
      if (editingPost?.id === post.id) {
        setEditingPost(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete post");
    } finally {
      setDeletingPostId("");
    }
  }

  async function handleBlockUser(post) {
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    if (!post?.user_id || post.user_id === currentUser.id || blockingUserId) {
      return;
    }

    const displayName = post.nickname || "this user";
    if (!window.confirm(`Block ${displayName}? Their posts will be removed from your feed.`)) {
      return;
    }

    setBlockingUserId(post.user_id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocks/${post.user_id}`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to block user");
      }

      setPosts((currentPosts) => currentPosts.filter((item) => item.user_id !== post.user_id));

      if (activeCommentsPostId) {
        const activePost = posts.find((item) => item.id === activeCommentsPostId);
        if (activePost?.user_id === post.user_id) {
          setActiveCommentsPostId("");
          setCommentsErrorMessage("");
        }
      }

      if (editingPost?.user_id === post.user_id) {
        setEditingPost(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to block user");
    } finally {
      setBlockingUserId("");
    }
  }

  function renderSearchForm(isCompact = false) {
    return (
      <form
        onSubmit={handleSearchSubmit}
        className={
          isCompact
            ? "w-full rounded-full border border-white/10 bg-black/80 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur"
            : "rounded-full border border-white/10 bg-black/80 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur"
        }
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search posts"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/15 hover:text-white"
              aria-label="Clear search"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  function renderCommentsPanel() {
    if (!activeCommentsPostId) {
      return null;
    }

    const activePost = posts.find((post) => post.id === activeCommentsPostId);
    const comments = commentsByPostId[activeCommentsPostId] || [];
    const isLoadingComments = commentsLoadingPostId === activeCommentsPostId;
    const commentDraft = commentDraftByPostId[activeCommentsPostId] || "";
    const selectedImage = commentImageByPostId[activeCommentsPostId] || null;
    const isSubmittingComment = commentSubmittingPostId === activeCommentsPostId;

    return (
      <>
        <button
          type="button"
          aria-label="Close comments"
          onClick={() => setActiveCommentsPostId("")}
          className="fixed inset-0 z-30 bg-black/45 max-[1279px]:block xl:hidden"
        />
        <aside className="fixed right-0 top-0 z-[60] flex h-screen w-full max-w-[420px] flex-col border-l border-white/10 bg-[#101214]/95 backdrop-blur xl:max-w-[420px]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-lg font-semibold text-white">Comments</p>
              <p className="mt-1 text-sm text-white/45">
                {activePost ? `${formatCount(activePost.total_comments)} comments` : "Post discussion"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCommentsPostId("")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white transition hover:bg-white/10"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {commentsErrorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {commentsErrorMessage}
              </div>
            ) : null}

            {isLoadingComments ? (
              <div className="flex min-h-32 items-center justify-center">
                <span className="loading-spinner" aria-label="Loading comments" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex min-h-full items-center justify-center px-4 text-center">
                <p className="max-w-[220px] text-sm leading-6 text-white/35">
                  no comment yet, be the first one
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {comments.map((comment) => (
                  <article key={comment.id} className="flex gap-3">
                    <div className="shrink-0">
                      {renderUserAvatar(
                        comment.avatar_path,
                        comment.nickname || comment.user_id,
                        "h-10 w-10"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold text-white">{comment.nickname || comment.user_id}</p>
                          <p className="text-xs text-white/35">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                          {comment.is_edited ? (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                              Edited
                            </span>
                          ) : null}
                        </div>
                        {currentUser?.id === comment.user_id ? (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenCommentMenuId((current) =>
                                  current === comment.id ? "" : comment.id
                                )
                              }
                              data-comment-menu-trigger
                              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/65 transition hover:bg-white/10 hover:text-white"
                            >
                              ...
                            </button>
                            {openCommentMenuId === comment.id ? (
                              <div
                                data-comment-menu
                                className="absolute right-0 top-10 z-10 min-w-[132px] rounded-2xl border border-white/10 bg-[#1b1b1b] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment)}
                                  disabled={deletingCommentId === comment.id}
                                  className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingCommentId === comment.id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-all text-sm leading-7 text-white/78">
                        {comment.content}
                      </p>
                      {comment.image_path ? (
                        <img
                          src={normalizeImagePath(comment.image_path)}
                          alt={comment.nickname || comment.user_id}
                          className="mt-3 max-h-56 w-full rounded-2xl object-cover"
                        />
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-5">
            {currentUser ? (
              <div className="space-y-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-3 py-3 transition focus-within:border-white/25">
                  {selectedImage ? (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-3 py-2">
                      <span className="max-w-[140px] truncate text-xs text-white/55">
                        {selectedImage.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCommentImageByPostId((current) => ({
                            ...current,
                            [activeCommentsPostId]: null,
                          }))
                        }
                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={(event) =>
                        setCommentDraftByPostId((current) => ({
                          ...current,
                          [activeCommentsPostId]: event.target.value,
                        }))
                      }
                      placeholder="Write a comment"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleCreateComment();
                        }
                      }}
                      className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/35"
                    />
                    <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Add image" title="Add image">
                      <ImageIcon />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setCommentImageByPostId((current) => ({
                            ...current,
                            [activeCommentsPostId]: file,
                          }));
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleCreateComment}
                      disabled={isSubmittingComment}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fe2c55] text-white transition hover:bg-[#e0264b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Send comment"
                    >
                      {isSubmittingComment ? <span className="loading-spinner loading-spinner-sm" /> : <SendIcon />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b]"
              >
                Log in to comment
              </button>
            )}
          </div>
        </aside>
      </>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-black text-white">
      <div
        ref={feedScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto max-w-7xl px-4 py-0 xl:px-8">
        {renderExploreHashtags()}
        {errorMessage === "AUTH_REQUIRED" ? (
          <LoginRequiredState />
        ) : errorMessage ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorMessage}</span>
            {isExploreMode && !currentUser ? (
              <Link
                href="/auth/login"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white/90"
              >
                Log in
              </Link>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? null : isLoading ? (
          <div className="flex min-h-[82vh] items-center justify-center">
            <span className="loading-spinner" aria-label="Loading posts" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-[82vh] items-end justify-center pb-24">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55 shadow-sm">
            No posts found.
            </div>
          </div>
        ) : isExploreMode && !selectedExplorePostId ? (
          renderExploreGrid()
        ) : (
          <div className="mx-auto flex max-w-5xl flex-col gap-0">
            {isExploreMode ? (
              <div className="sticky top-[70px] z-10 flex justify-start px-2 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedExplorePostId("")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white"
                  aria-label="Back to explore"
                >
                  <BackIcon />
                </button>
              </div>
            ) : null}
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                articleProps={{ "data-post-id": post.id }}
                actionRailMode="interactive"
                hashtagMode="button"
                currentUserId={currentUser?.id || ""}
                onHashtagClick={handleHashtagClick}
                onLikeToggle={handleToggleLike}
                onRepostToggle={handleToggleRepost}
                onCommentsToggle={handleCommentsToggle}
                onFollowUser={handleFollowPostUser}
                onEditPost={handleOpenEditPost}
                onDeletePost={handleDeletePost}
                onBlockUser={handleBlockUser}
                isOwnerActionLoading={loadingEditPostId === post.id}
                isDeletePending={deletingPostId === post.id}
                isBlockPending={blockingUserId === post.user_id}
                isLikePending={pendingLikePostIds.includes(post.id)}
                isRepostPending={pendingRepostPostIds.includes(post.id)}
                isFollowUserPending={pendingFollowUserIds.includes(post.user_id)}
                showFollowUserButton={post.user_id !== currentUser?.id}
                activeCommentsPostId={activeCommentsPostId}
              />
            ))}
            </div>
          )}

        {!isLoading && (!isExploreMode || selectedExplorePostId) ? (
          <div ref={loadMoreRef} className="mt-10 flex snap-none justify-center pb-8">
            {isLoadingMore ? (
              <div className="flex px-5 py-3">
                <span className="loading-spinner loading-spinner-sm" aria-label="Loading more posts" />
              </div>
            ) : nextCursor ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/45">
                Scroll down for more
              </div>
            ) : posts.length > 0 ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/45">
                You reached the end of the feed
              </div>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
      {renderCommentsPanel()}
      <PostEditModal
        post={editingPost}
        isSubmitting={isEditPostSubmitting}
        errorMessage={editPostErrorMessage}
        onClose={() => {
          if (isEditPostSubmitting) {
            return;
          }

          setEditingPost(null);
          setEditPostErrorMessage("");
        }}
        onSubmit={handleSubmitEditPost}
      />
    </main>
  );
}
