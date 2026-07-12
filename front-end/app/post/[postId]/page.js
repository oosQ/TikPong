"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

export default function PostDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = Array.isArray(params?.postId) ? params.postId[0] : params?.postId;
  const viewTimeoutRef = useRef(null);
  const hasTrackedViewRef = useRef(false);
  const collectionScrollRef = useRef(null);
  const collectionPendingTimeoutsRef = useRef(new Map());
  const collectionTrackedViewIdsRef = useRef(new Set());
  const collectionCommentVisibilityRatiosRef = useRef(new Map());

  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileCollection, setProfileCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
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

  const isProfileSource = searchParams.get("source") === "profile";
  const isHashtagSource = searchParams.get("source") === "hashtag";

  function getBackLink() {
    if (profileCollection?.profileHref) {
      return {
        href: profileCollection.profileHref,
        label: "Back to profile",
      };
    }

    if (profileCollection?.hashtagHref) {
      return {
        href: profileCollection.hashtagHref,
        label: profileCollection.hashtagName ? `Back to #${profileCollection.hashtagName}` : "Back to hashtag",
      };
    }

    return {
      href: "/posts",
      label: "Back to feed",
    };
  }

  async function loadPostDetail(targetPostId) {
    const response = await fetch(`${API_BASE_URL}/api/posts/${targetPostId}`, {
      method: "GET",
      credentials: "include",
    });

    const payload = await parseResponse(response);
    if (!response.ok || !payload?.success || !payload?.data) {
      throw new Error(payload?.error || "Failed to load post details");
    }

    return payload.data;
  }

  async function sendPostView(targetPostId, updateCollection = false) {
    if (!currentUser || !targetPostId) {
      return;
    }

    const trackedSet = updateCollection ? collectionTrackedViewIdsRef.current : hasTrackedViewRef;
    if (updateCollection && trackedSet.has(targetPostId)) {
      return;
    }
    if (!updateCollection && hasTrackedViewRef.current) {
      return;
    }

    if (updateCollection) {
      trackedSet.add(targetPostId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${targetPostId}/view`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to create post view");
      }

      if (updateCollection) {
        setProfileCollection((currentCollection) =>
          currentCollection
            ? {
                ...currentCollection,
                posts: currentCollection.posts.map((item) =>
                  item.id === targetPostId
                    ? { ...item, total_views: Number(item.total_views || 0) + 1 }
                    : item
                ),
              }
            : currentCollection
        );
        return;
      }

      hasTrackedViewRef.current = true;
      setPost((currentPost) =>
        currentPost
          ? { ...currentPost, total_views: Number(currentPost.total_views || 0) + 1 }
          : currentPost
      );
    } catch {
      if (updateCollection) {
        collectionTrackedViewIdsRef.current.delete(targetPostId);
      } else {
        hasTrackedViewRef.current = false;
      }
    }
  }

  function updatePostRecord(targetPostId, updater) {
    let didUpdate = false;

    setProfileCollection((currentCollection) => {
      if (!currentCollection?.posts?.some((item) => item.id === targetPostId)) {
        return currentCollection;
      }

      didUpdate = true;
      return {
        ...currentCollection,
        posts: currentCollection.posts.map((item) =>
          item.id === targetPostId ? updater(item) : item
        ),
      };
    });

    if (!didUpdate) {
      setPost((currentPost) =>
        currentPost?.id === targetPostId ? updater(currentPost) : currentPost
      );
    }
  }

  function getActivePostById(targetPostId) {
    if (!targetPostId) {
      return null;
    }

    return (
      profileCollection?.posts?.find((item) => item.id === targetPostId) ||
      (post?.id === targetPostId ? post : null)
    );
  }

  useEffect(() => {
    let ignore = false;

    async function fetchPost() {
      if (!postId) {
        setErrorMessage("Missing post id");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        let storedProfileCollection = null;
        if (isProfileSource || isHashtagSource) {
          try {
            const storageKey = isProfileSource ? "profile-post-viewer" : "hashtag-post-viewer";
            const rawValue = window.sessionStorage.getItem(storageKey);
            const parsedValue = rawValue ? JSON.parse(rawValue) : null;

            if (
              parsedValue?.posts?.length &&
              parsedValue.posts.some((item) => item.id === postId)
            ) {
              storedProfileCollection = parsedValue;
            }
          } catch {
            storedProfileCollection = null;
          }
        }

        const [postResponse, currentUserResponse] = await Promise.all([
          storedProfileCollection
            ? Promise.resolve(null)
            : fetch(`${API_BASE_URL}/api/posts/${postId}`, {
                method: "GET",
                credentials: "include",
              }),
          fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        const [payload, currentUserPayload] = await Promise.all([
          postResponse ? parseResponse(postResponse) : Promise.resolve(null),
          parseResponse(currentUserResponse),
        ]);

        if (!storedProfileCollection && (!postResponse?.ok || !payload?.success || !payload?.data)) {
          throw new Error(payload?.error || "Failed to load post details");
        }

        if (!ignore) {
          setPost(storedProfileCollection ? null : payload.data);
          setProfileCollection(
            storedProfileCollection
              ? {
                  ...storedProfileCollection,
                  posts: storedProfileCollection.posts,
                }
              : null
          );
          setCurrentUser(
            currentUserResponse.ok && currentUserPayload?.success ? currentUserPayload.data ?? null : null
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "Failed to load post details");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      ignore = true;
    };
  }, [isHashtagSource, isProfileSource, postId]);

  useEffect(() => {
    if (profileCollection?.posts?.length && collectionScrollRef.current) {
      const activeElement = collectionScrollRef.current.querySelector(`[data-collection-post-id="${postId}"]`);
      if (activeElement instanceof HTMLElement) {
        requestAnimationFrame(() => {
          activeElement.scrollIntoView({ block: "start" });
        });
      }
    }
  }, [postId, profileCollection?.posts?.length]);

  useEffect(() => {
    if (!profileCollection?.posts?.length || !collectionScrollRef.current || !currentUser) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const targetPostId = target.dataset.collectionPostId;
          if (!targetPostId || collectionTrackedViewIdsRef.current.has(targetPostId)) {
            return;
          }

          const existingTimeout = collectionPendingTimeoutsRef.current.get(targetPostId);

          if (entry.isIntersecting) {
            if (existingTimeout) {
              return;
            }

            const timeoutId = window.setTimeout(() => {
              collectionPendingTimeoutsRef.current.delete(targetPostId);
              void sendPostView(targetPostId, true);
            }, 2000);

            collectionPendingTimeoutsRef.current.set(targetPostId, timeoutId);
            return;
          }

          if (existingTimeout) {
            window.clearTimeout(existingTimeout);
            collectionPendingTimeoutsRef.current.delete(targetPostId);
          }
        });
      },
      {
        root: collectionScrollRef.current,
        threshold: 0.7,
      }
    );

    const postElements = collectionScrollRef.current.querySelectorAll("[data-collection-post-id]");
    postElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      collectionPendingTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      collectionPendingTimeoutsRef.current.clear();
    };
  }, [currentUser, profileCollection]);

  useEffect(() => {
    if (!profileCollection?.posts?.length || !collectionScrollRef.current || !activeCommentsPostId) {
      collectionCommentVisibilityRatiosRef.current.clear();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const targetPostId = target.dataset.collectionPostId;
          if (!targetPostId) {
            return;
          }

          collectionCommentVisibilityRatiosRef.current.set(
            targetPostId,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        });

        let nextPostId = "";
        let nextRatio = 0;

        collectionCommentVisibilityRatiosRef.current.forEach((ratio, targetPostId) => {
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
        root: collectionScrollRef.current,
        threshold: [0.4, 0.6, 0.8],
      }
    );

    const postElements = collectionScrollRef.current.querySelectorAll("[data-collection-post-id]");
    postElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      collectionCommentVisibilityRatiosRef.current.clear();
    };
  }, [activeCommentsPostId, profileCollection?.posts, commentsByPostId]);

  useEffect(() => {
    if (profileCollection?.posts?.length) {
      return undefined;
    }

    if (!post?.id || !currentUser || hasTrackedViewRef.current) {
      return undefined;
    }

    viewTimeoutRef.current = window.setTimeout(async () => {
      await sendPostView(post.id, false);
    }, 2000);

    return () => {
      if (viewTimeoutRef.current) {
        window.clearTimeout(viewTimeoutRef.current);
        viewTimeoutRef.current = null;
      }
    };
  }, [post, currentUser, profileCollection]);

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

  async function handleToggleLike(postItem) {
    if (!currentUser) {
      setErrorMessage("Login first to like posts");
      router.push("/auth/login");
      return;
    }

    const targetPostId = postItem.id;
    const isLiked = Number(postItem.is_liked) === 1;

    if (pendingLikePostIds.includes(targetPostId)) {
      return;
    }

    setPendingLikePostIds((current) => [...current, targetPostId]);
    setErrorMessage("");

    updatePostRecord(targetPostId, (item) => ({
      ...item,
      is_liked: isLiked ? 0 : 1,
      total_likes: isLiked
        ? Math.max(0, Number(item.total_likes || 0) - 1)
        : Number(item.total_likes || 0) + 1,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${targetPostId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update like");
      }
    } catch (error) {
      updatePostRecord(targetPostId, (item) => ({
        ...item,
        is_liked: isLiked ? 1 : 0,
        total_likes: Number(postItem.total_likes || 0),
      }));
      setErrorMessage(error.message || "Failed to update like");
    } finally {
      setPendingLikePostIds((current) => current.filter((id) => id !== targetPostId));
    }
  }

  async function handleToggleRepost(postItem) {
    if (!currentUser) {
      setErrorMessage("Login first to repost posts");
      router.push("/auth/login");
      return;
    }

    const targetPostId = postItem.id;
    const isReposted = Number(postItem.is_reposted) === 1;

    if (pendingRepostPostIds.includes(targetPostId)) {
      return;
    }

    setPendingRepostPostIds((current) => [...current, targetPostId]);
    setErrorMessage("");

    updatePostRecord(targetPostId, (item) => ({
      ...item,
      is_reposted: isReposted ? 0 : 1,
      total_reposts: isReposted
        ? Math.max(0, Number(item.total_reposts || 0) - 1)
        : Number(item.total_reposts || 0) + 1,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${targetPostId}/repost`, {
        method: isReposted ? "DELETE" : "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update repost");
      }
    } catch (error) {
      updatePostRecord(targetPostId, (item) => ({
        ...item,
        is_reposted: isReposted ? 1 : 0,
        total_reposts: Number(postItem.total_reposts || 0),
      }));
      setErrorMessage(error.message || "Failed to update repost");
    } finally {
      setPendingRepostPostIds((current) => current.filter((id) => id !== targetPostId));
    }
  }

  async function fetchComments(targetPostId) {
    setCommentsLoadingPostId(targetPostId);
    setCommentsErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${targetPostId}/comments?limit=50`, {
        method: "GET",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load comments");
      }

      setCommentsByPostId((current) => ({
        ...current,
        [targetPostId]: payload?.data?.comments || [],
      }));
    } catch (error) {
      setCommentsErrorMessage(error.message || "Failed to load comments");
    } finally {
      setCommentsLoadingPostId("");
    }
  }

  async function handleCommentsToggle(postItem) {
    if (activeCommentsPostId === postItem.id) {
      setActiveCommentsPostId("");
      setCommentsErrorMessage("");
      return;
    }

    setActiveCommentsPostId(postItem.id);
    if (!commentsByPostId[postItem.id]) {
      await fetchComments(postItem.id);
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
      updatePostRecord(activeCommentsPostId, (item) => ({
        ...item,
        total_comments: Number(item.total_comments || 0) + 1,
      }));
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
      updatePostRecord(activeCommentsPostId, (item) => ({
        ...item,
        total_comments: Math.max(0, Number(item.total_comments || 0) - 1),
      }));
      setOpenCommentMenuId("");
    } catch (error) {
      setCommentsErrorMessage(error.message || "Failed to delete comment");
    } finally {
      setDeletingCommentId("");
    }
  }

  async function handleOpenEditPost(postItem) {
    if (!currentUser || currentUser.id !== postItem.user_id || loadingEditPostId) {
      return;
    }

    setLoadingEditPostId(postItem.id);
    setEditPostErrorMessage("");
    setErrorMessage("");

    try {
      const detail = await loadPostDetail(postItem.id);
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
      updatePostRecord(editingPost.id, (item) => ({
        ...item,
        title: updatedDetail.title,
        content: updatedDetail.content,
        privacy: updatedDetail.privacy,
        image_path: updatedDetail.image_path,
        hashtags: updatedDetail.hashtags,
        is_edited: updatedDetail.is_edited,
      }));
      if (post?.id === editingPost.id) {
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                ...updatedDetail,
              }
            : currentPost
        );
      }
      setEditingPost(null);
    } catch (error) {
      setEditPostErrorMessage(error.message || "Failed to update post");
    } finally {
      setIsEditPostSubmitting(false);
    }
  }

  function buildCurrentPostHref(targetPostId) {
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    return queryString ? `/post/${targetPostId}?${queryString}` : `/post/${targetPostId}`;
  }

  async function handleDeletePost(postItem) {
    if (!currentUser || currentUser.id !== postItem.user_id || deletingPostId) {
      return;
    }

    if (!window.confirm("Delete this post?")) {
      return;
    }

    setDeletingPostId(postItem.id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postItem.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to delete post");
      }

      if (profileCollection?.posts?.length) {
        const remainingPosts = profileCollection.posts.filter((item) => item.id !== postItem.id);
        if (remainingPosts.length === 0) {
          router.replace(backLink.href);
          return;
        }

        setProfileCollection((currentCollection) =>
          currentCollection
            ? {
                ...currentCollection,
                posts: remainingPosts,
              }
            : currentCollection
        );

        if (postItem.id === postId) {
          router.replace(buildCurrentPostHref(remainingPosts[0].id));
        }
      } else {
        router.replace(backLink.href);
        return;
      }

      if (activeCommentsPostId === postItem.id) {
        setActiveCommentsPostId("");
        setCommentsErrorMessage("");
      }
      if (editingPost?.id === postItem.id) {
        setEditingPost(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete post");
    } finally {
      setDeletingPostId("");
    }
  }

  async function handleBlockUser(postItem) {
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    if (!postItem?.user_id || postItem.user_id === currentUser.id || blockingUserId) {
      return;
    }

    const displayName = postItem.nickname || "this user";
    if (!window.confirm(`Block ${displayName}? Their posts will be removed from your view.`)) {
      return;
    }

    setBlockingUserId(postItem.user_id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocks/${postItem.user_id}`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await parseResponse(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to block user");
      }

      if (profileCollection?.posts?.length) {
        const remainingPosts = profileCollection.posts.filter((item) => item.user_id !== postItem.user_id);
        if (remainingPosts.length === 0) {
          router.replace(getBackLink().href);
          return;
        }

        setProfileCollection((currentCollection) =>
          currentCollection
            ? {
                ...currentCollection,
                posts: remainingPosts,
              }
            : currentCollection
        );

        if (postItem.id === postId) {
          router.replace(buildCurrentPostHref(remainingPosts[0].id));
          return;
        }
      } else if (post?.user_id === postItem.user_id) {
        router.replace(getBackLink().href);
        return;
      }

      if (activeCommentsPostId) {
        const activePost = getActivePostById(activeCommentsPostId);
        if (activePost?.user_id === postItem.user_id) {
          setActiveCommentsPostId("");
          setCommentsErrorMessage("");
        }
      }

      if (editingPost?.user_id === postItem.user_id) {
        setEditingPost(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to block user");
    } finally {
      setBlockingUserId("");
    }
  }

  function renderCommentsPanel() {
    if (!activeCommentsPostId) {
      return null;
    }

    const activePost = getActivePostById(activeCommentsPostId);
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

  const backLink = getBackLink();

  return (
    <main className="relative min-h-screen bg-black px-4 py-0 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          {profileCollection?.posts?.length ? <div /> : <div className="pointer-events-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-white/45">Post View</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Post details</h1>
          </div>}
          <Link
            href={backLink.href}
            className="pointer-events-auto rounded-full border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            {backLink.label}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {isLoading ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 pt-32 text-center text-white/60">
            Loading post...
          </div>
        ) : errorMessage ? (
          <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 p-8 pt-32 text-center text-red-200">
            {errorMessage}
          </div>
        ) : profileCollection?.posts?.length ? (
          <div
            ref={collectionScrollRef}
            className="max-h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-0 pr-1">
              {profileCollection.posts.map((item) => (
                <FeedPostCard
                  key={item.id}
                  post={item}
                  articleProps={{ "data-collection-post-id": item.id }}
                  actionRailMode="interactive"
                  hashtagMode="span"
                  currentUserId={currentUser?.id || ""}
                  onLikeToggle={handleToggleLike}
                  onRepostToggle={handleToggleRepost}
                  onCommentsToggle={handleCommentsToggle}
                  onEditPost={handleOpenEditPost}
                  onDeletePost={handleDeletePost}
                  onBlockUser={handleBlockUser}
                  isOwnerActionLoading={loadingEditPostId === item.id}
                  isDeletePending={deletingPostId === item.id}
                  isBlockPending={blockingUserId === item.user_id}
                  isLikePending={pendingLikePostIds.includes(item.id)}
                  isRepostPending={pendingRepostPostIds.includes(item.id)}
                  activeCommentsPostId={activeCommentsPostId}
                />
              ))}
            </div>
          </div>
        ) : !post ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 pt-32 text-center text-white/60">
            Post not found.
          </div>
        ) : (
          <FeedPostCard
            post={post}
            actionRailMode="interactive"
            hashtagMode="span"
            currentUserId={currentUser?.id || ""}
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
        )}
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