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

  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pendingLikePostIds, setPendingLikePostIds] = useState([]);
  const [pendingRepostPostIds, setPendingRepostPostIds] = useState([]);
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

  const activeQuery = searchParams.get("q") ?? "";
  const activeMode = searchParams.get("mode") ?? "";
  const feedRequestKey = `${activeMode}::${activeQuery}`;

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
          setErrorMessage(error.message || "Failed to load posts");
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
            ? "flex w-full flex-col gap-3 rounded-[28px] border border-white/10 bg-black/80 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur"
            : "flex flex-col gap-3 rounded-full border border-white/10 bg-black/80 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur sm:flex-row"
        }
      >
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search posts"
          className="flex-1 rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
        />
        <div className={isCompact ? "grid grid-cols-1 gap-3" : "contents"}>
          <button
            type="submit"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClearSearch}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Clear
          </button>
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
        <aside className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-[420px] flex-col border-l border-white/10 bg-black/95 backdrop-blur xl:max-w-[420px]">
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                No comments yet.
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
                      <div className="mt-3 flex items-center gap-3 text-xs text-white/45">
                        <span>{formatCount(comment.total_likes)} likes</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-5">
            {currentUser ? (
              <div className="space-y-3">
                <textarea
                  value={commentDraft}
                  onChange={(event) =>
                    setCommentDraftByPostId((current) => ({
                      ...current,
                      [activeCommentsPostId]: event.target.value,
                    }))
                  }
                  placeholder="Write a comment"
                  rows={3}
                  className="w-full resize-none rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25"
                />
                <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                    <span>Add image</span>
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
                  {selectedImage ? (
                    <div className="flex items-center gap-3">
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
                  ) : (
                    <span className="text-xs text-white/40">PNG, JPG, GIF</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateComment}
                  disabled={isSubmittingComment}
                  className="w-full rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e0264b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingComment ? "Posting..." : "Post comment"}
                </button>
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
        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55 shadow-sm">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-[82vh] items-end justify-center pb-24">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55 shadow-sm">
            No posts found.
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-5xl flex-col gap-0">
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
                onEditPost={handleOpenEditPost}
                onDeletePost={handleDeletePost}
                onBlockUser={handleBlockUser}
                isOwnerActionLoading={loadingEditPostId === post.id}
                isDeletePending={deletingPostId === post.id}
                isBlockPending={blockingUserId === post.user_id}
                isLikePending={pendingLikePostIds.includes(post.id)}
                isRepostPending={pendingRepostPostIds.includes(post.id)}
                activeCommentsPostId={activeCommentsPostId}
              />
            ))}
            </div>
          )}

        {!isLoading ? (
          <div ref={loadMoreRef} className="mt-10 flex snap-none justify-center pb-8">
            {isLoadingMore ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/65">
                Loading more posts...
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