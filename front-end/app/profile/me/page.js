"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileView from "@/app/profile/_components/profile-view";
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

export default function MyProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [repostPosts, setRepostPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [hasLoadedLikedPosts, setHasLoadedLikedPosts] = useState(false);
  const [hasLoadedRepostPosts, setHasLoadedRepostPosts] = useState(false);
  const [isLikedPostsLoading, setIsLikedPostsLoading] = useState(false);
  const [isRepostPostsLoading, setIsRepostPostsLoading] = useState(false);
  const [likedPostsError, setLikedPostsError] = useState("");
  const [repostPostsError, setRepostPostsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: "",
    firstName: "",
    lastName: "",
    aboutMe: "",
    isPublic: false,
  });
  const [editProfileError, setEditProfileError] = useState("");
  const [isEditProfileSubmitting, setIsEditProfileSubmitting] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState("");
  const [isAvatarSubmitting, setIsAvatarSubmitting] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState("following");
  const [connectionsByTab, setConnectionsByTab] = useState({
    following: [],
    followers: [],
    blocked: [],
  });
  const [loadedConnectionsTabs, setLoadedConnectionsTabs] = useState([]);
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const [unblockingUserId, setUnblockingUserId] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [loadingEditPostId, setLoadingEditPostId] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");
  const [isEditPostSubmitting, setIsEditPostSubmitting] = useState(false);
  const [editPostErrorMessage, setEditPostErrorMessage] = useState("");

  async function fetchProfilePage() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const currentUserResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      const currentUserPayload = await parseResponse(currentUserResponse);

      if (!currentUserResponse.ok || !currentUserPayload?.success || !currentUserPayload?.data?.id) {
        throw new Error("Login first to view your profile");
      }

      const nextCurrentUserId = currentUserPayload.data.id;

      const [profileResponse, postsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/users/${nextCurrentUserId}/posts?limit=50`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const profilePayload = await parseResponse(profileResponse);
      const postsPayload = await parseResponse(postsResponse);

      if (!profileResponse.ok || !profilePayload?.success || !profilePayload?.data) {
        throw new Error(profilePayload?.error || "Failed to load your profile");
      }

      if (!postsResponse.ok || !postsPayload?.success) {
        throw new Error(postsPayload?.error || "Failed to load your posts");
      }

      setProfile(profilePayload.data);
      setPosts(postsPayload?.data?.posts || []);
    } finally {
      setIsLoading(false);
    }
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

  function applyUpdatedPost(updatedPost) {
    const nextFields = {
      title: updatedPost.title,
      content: updatedPost.content,
      privacy: updatedPost.privacy,
      image_path: updatedPost.image_path,
      hashtags: updatedPost.hashtags,
      is_edited: updatedPost.is_edited,
      allowed_viewers: updatedPost.allowed_viewers,
    };

    setPosts((currentPosts) =>
      currentPosts.map((item) => (item.id === updatedPost.id ? { ...item, ...nextFields } : item))
    );
    setLikedPosts((currentPosts) =>
      currentPosts.map((item) => (item.id === updatedPost.id ? { ...item, ...nextFields } : item))
    );
    setRepostPosts((currentPosts) =>
      currentPosts.map((item) => (item.id === updatedPost.id ? { ...item, ...nextFields } : item))
    );
  }

  async function fetchLikedPosts() {
    setIsLikedPostsLoading(true);
    setLikedPostsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me/liked-posts?limit=50`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load liked posts");
      }

      setLikedPosts(payload?.data?.posts || []);
      setHasLoadedLikedPosts(true);
    } catch (error) {
      setLikedPosts([]);
      setLikedPostsError(error.message || "Failed to load liked posts");
    } finally {
      setIsLikedPostsLoading(false);
    }
  }

  async function fetchRepostPosts() {
    if (!profile?.id) {
      return;
    }

    setIsRepostPostsLoading(true);
    setRepostPostsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${profile.id}/reposts?limit=50`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load reposts");
      }

      setRepostPosts(payload?.data?.posts || []);
      setHasLoadedRepostPosts(true);
    } catch (error) {
      setRepostPosts([]);
      setRepostPostsError(error.message || "Failed to load reposts");
    } finally {
      setIsRepostPostsLoading(false);
    }
  }

  async function handleOpenEditPost(post) {
    if (!post?.id || loadingEditPostId || deletingPostId) {
      return;
    }

    setLoadingEditPostId(post.id);
    setEditPostErrorMessage("");

    try {
      const detail = await loadPostDetail(post.id);
      setEditingPost(detail);
    } catch (error) {
      setEditPostErrorMessage(error.message || "Failed to load post details");
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
      applyUpdatedPost(updatedDetail);
      setEditingPost(null);
    } catch (error) {
      setEditPostErrorMessage(error.message || "Failed to update post");
    } finally {
      setIsEditPostSubmitting(false);
    }
  }

  async function handleDeletePost(post) {
    if (!post?.id || deletingPostId || loadingEditPostId || profile?.id !== post.user_id) {
      return;
    }

    if (!window.confirm("Delete this post?")) {
      return;
    }

    setDeletingPostId(post.id);
    setEditPostErrorMessage("");

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
      setLikedPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id));
      setRepostPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id));
      setProfile((currentProfile) => {
        if (!currentProfile) {
          return currentProfile;
        }

        return {
          ...currentProfile,
          total_posts: Math.max((currentProfile.total_posts || 0) - 1, 0),
        };
      });

      if (editingPost?.id === post.id) {
        setEditingPost(null);
      }
    } catch (error) {
      setEditPostErrorMessage(error.message || "Failed to delete post");
    } finally {
      setDeletingPostId("");
    }
  }

  async function handleTabChange(nextTab) {
    setActiveTab(nextTab);

    if (nextTab === "liked") {
      if (!hasLoadedLikedPosts && !isLikedPostsLoading) {
        await fetchLikedPosts();
      }

      return;
    }

    if (nextTab === "reposts" && !hasLoadedRepostPosts && !isRepostPostsLoading) {
      await fetchRepostPosts();
    }
  }

  async function fetchConnections(tab) {
    const endpoint =
      tab === "followers"
        ? "/api/followers?limit=100"
        : tab === "blocked"
          ? "/api/blocks?limit=100"
          : "/api/following?limit=100";

    setIsConnectionsLoading(true);
    setConnectionsError("");

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Failed to load ${tab}`);
      }

      setConnectionsByTab((current) => ({
        ...current,
        [tab]: payload?.data?.users || [],
      }));
      setLoadedConnectionsTabs((current) => (current.includes(tab) ? current : [...current, tab]));
    } catch (error) {
      setConnectionsByTab((current) => ({
        ...current,
        [tab]: [],
      }));
      setConnectionsError(error.message || `Failed to load ${tab}`);
    } finally {
      setIsConnectionsLoading(false);
    }
  }

  async function handleOpenConnectionsModal(tab) {
    setIsConnectionsModalOpen(true);
    setActiveConnectionsTab(tab);

    if (!loadedConnectionsTabs.includes(tab) && !isConnectionsLoading) {
      await fetchConnections(tab);
      return;
    }

    setConnectionsError("");
  }

  async function handleConnectionsTabChange(tab) {
    setActiveConnectionsTab(tab);

    if (!loadedConnectionsTabs.includes(tab) && !isConnectionsLoading) {
      await fetchConnections(tab);
      return;
    }

    setConnectionsError("");
  }

  async function handleUnblockConnection(userId) {
    if (!userId || unblockingUserId) {
      return;
    }

    setUnblockingUserId(userId);
    setConnectionsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocks/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to unblock user");
      }

      setConnectionsByTab((current) => ({
        ...current,
        blocked: (current.blocked || []).filter((user) => user.user_id !== userId),
      }));
    } catch (error) {
      setConnectionsError(error.message || "Failed to unblock user");
    } finally {
      setUnblockingUserId("");
    }
  }

  function handleCloseConnectionsModal() {
    setIsConnectionsModalOpen(false);
    setConnectionsError("");
  }

  function clearAvatarSelection() {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setSelectedAvatarFile(null);
    setAvatarPreviewUrl("");
  }

  function buildEditForm(nextProfile) {
    return {
      nickname: nextProfile?.nickname || "",
      firstName: nextProfile?.first_name || "",
      lastName: nextProfile?.last_name || "",
      aboutMe: nextProfile?.about_me || "",
      isPublic: Boolean(nextProfile?.is_public),
    };
  }

  function handleEditProfileOpen() {
    setEditForm(buildEditForm(profile));
    setEditProfileError("");
    setIsEditProfileOpen(true);
  }

  function handleEditProfileCancel() {
    setEditProfileError("");
    setIsEditProfileOpen(false);
  }

  function handleEditFormChange(field, value) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleEditProfileSubmit() {
    if (profile && Boolean(profile.is_public) !== Boolean(editForm.isPublic)) {
      const nextVisibility = editForm.isPublic ? "public" : "private";
      if (!window.confirm(`Change your profile to ${nextVisibility}?`)) {
        return;
      }
    }

    setIsEditProfileSubmitting(true);
    setEditProfileError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: editForm.nickname,
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          about_me: editForm.aboutMe,
          is_public: editForm.isPublic,
        }),
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update profile");
      }

      await fetchProfilePage();
      if (hasLoadedLikedPosts) {
        await fetchLikedPosts();
      }
      if (hasLoadedRepostPosts) {
        await fetchRepostPosts();
      }
      setIsEditProfileOpen(false);
    } catch (error) {
      setEditProfileError(error.message || "Failed to update profile");
    } finally {
      setIsEditProfileSubmitting(false);
    }
  }

  function handleAvatarEditorToggle() {
    setIsAvatarEditorOpen((currentValue) => !currentValue);
    setAvatarUploadError("");
    setAvatarUploadSuccess("");
  }

  function handleAvatarFileChange(event) {
    const nextFile = event.target.files?.[0];

    setAvatarUploadError("");
    setAvatarUploadSuccess("");

    if (!nextFile) {
      clearAvatarSelection();
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setSelectedAvatarFile(nextFile);
    setAvatarPreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleAvatarCancel() {
    clearAvatarSelection();
    setAvatarUploadError("");
    setAvatarUploadSuccess("");
    setIsAvatarEditorOpen(false);
  }

  async function handleAvatarSubmit() {
    if (!selectedAvatarFile) {
      setAvatarUploadError("Choose an image first");
      return;
    }

    setIsAvatarSubmitting(true);
    setAvatarUploadError("");
    setAvatarUploadSuccess("");

    const formData = new FormData();
    formData.append("avatar_path", selectedAvatarFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update avatar");
      }

      await fetchProfilePage();
      if (hasLoadedLikedPosts) {
        await fetchLikedPosts();
      }
      if (hasLoadedRepostPosts) {
        await fetchRepostPosts();
      }
      setAvatarUploadSuccess(payload?.message || "Avatar updated successfully");
      clearAvatarSelection();
    } catch (error) {
      setAvatarUploadError(error.message || "Failed to update avatar");
    } finally {
      setIsAvatarSubmitting(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        await fetchProfilePage();
      } catch (error) {
        if (!ignore) {
          setProfile(null);
          setPosts([]);
          setErrorMessage(error.message || "Failed to load your profile");
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  return (
    <>
      <ProfileView
        profile={profile}
        posts={posts}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isSelf={true}
        titleLabel="Your profile"
        onLogin={() => router.push("/auth/login")}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        likedPosts={likedPosts}
        repostPosts={repostPosts}
        isLikedPostsLoading={isLikedPostsLoading}
        isRepostPostsLoading={isRepostPostsLoading}
        likedPostsError={likedPostsError}
        repostPostsError={repostPostsError}
        onEditProfileClick={handleEditProfileOpen}
        isEditProfileOpen={isEditProfileOpen}
        editForm={editForm}
        editProfileError={editProfileError}
        isEditProfileSubmitting={isEditProfileSubmitting}
        onEditFormChange={handleEditFormChange}
        onEditProfileSubmit={handleEditProfileSubmit}
        onEditProfileCancel={handleEditProfileCancel}
        onAvatarClick={handleAvatarEditorToggle}
        isAvatarEditorOpen={isAvatarEditorOpen}
        avatarPreviewUrl={avatarPreviewUrl}
        selectedAvatarName={selectedAvatarFile?.name || ""}
        avatarUploadError={avatarUploadError}
        avatarUploadSuccess={avatarUploadSuccess}
        isAvatarSubmitting={isAvatarSubmitting}
        onAvatarFileChange={handleAvatarFileChange}
        onAvatarSubmit={handleAvatarSubmit}
        onAvatarCancel={handleAvatarCancel}
        isConnectionsModalOpen={isConnectionsModalOpen}
        activeConnectionsTab={activeConnectionsTab}
        onOpenConnectionsModal={handleOpenConnectionsModal}
        onConnectionsTabChange={handleConnectionsTabChange}
        onCloseConnectionsModal={handleCloseConnectionsModal}
        connections={connectionsByTab[activeConnectionsTab] || []}
        isConnectionsLoading={isConnectionsLoading}
        connectionsError={connectionsError}
        showBlockedConnectionsTab
        onUnblockConnection={handleUnblockConnection}
        unblockingUserId={unblockingUserId}
        currentUserId={profile?.id || ""}
        onEditPost={handleOpenEditPost}
        onDeletePost={handleDeletePost}
        loadingEditPostId={loadingEditPostId}
        deletingPostId={deletingPostId}
      />
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
    </>
  );
}
