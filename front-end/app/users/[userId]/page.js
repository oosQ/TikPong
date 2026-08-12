"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileView from "@/app/profile/_components/profile-view";

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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [repostPosts, setRepostPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [hasLoadedRepostPosts, setHasLoadedRepostPosts] = useState(false);
  const [isRepostPostsLoading, setIsRepostPostsLoading] = useState(false);
  const [repostPostsError, setRepostPostsError] = useState("");
  const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(false);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const [followActionError, setFollowActionError] = useState("");
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState("following");
  const [connectionsByTab, setConnectionsByTab] = useState({
    following: [],
    followers: [],
  });
  const [loadedConnectionsTabs, setLoadedConnectionsTabs] = useState([]);
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const [isBlockActionLoading, setIsBlockActionLoading] = useState(false);
  const [blockActionError, setBlockActionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchSentFollowRequestState(targetUserId) {
    const response = await fetch(`${API_BASE_URL}/api/follow-requests/sent?limit=100`, {
      method: "GET",
      credentials: "include",
    });
    const payload = await parseResponse(response);

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Failed to load sent follow requests");
    }

    const requests = payload?.data?.requests || [];

    return requests.some(
      (request) => request?.target_id === targetUserId && request?.status === "pending"
    );
  }

  async function fetchProfilePage() {
    if (!userId) {
      setErrorMessage("Missing user id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const currentUserResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      const currentUserPayload = await parseResponse(currentUserResponse);
      const nextCurrentUser =
        currentUserResponse.ok && currentUserPayload?.success ? currentUserPayload.data : null;

      if (nextCurrentUser?.id === userId) {
        router.replace("/profile/me");
        return;
      }

      const [profileResponse, postsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/users/${userId}/posts?limit=50`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const profilePayload = await parseResponse(profileResponse);
      const postsPayload = await parseResponse(postsResponse);

      if (!postsResponse.ok || !postsPayload?.success) {
        throw new Error(postsPayload?.error || "Failed to load user posts");
      }

      if (!profileResponse.ok || !profilePayload?.success || !profilePayload?.data) {
        if (profileResponse.status === 401 && !nextCurrentUser) {
          throw new Error("Login first to view profile details");
        }

        throw new Error(profilePayload?.error || "Failed to load user profile");
      }

      let nextHasPendingFollowRequest = false;

      if (nextCurrentUser && !profilePayload.data.is_public && Number(profilePayload.data.is_following) !== 1) {
        try {
          nextHasPendingFollowRequest = await fetchSentFollowRequestState(userId);
        } catch {
          nextHasPendingFollowRequest = false;
        }
      }

      setCurrentUser(nextCurrentUser);
      setProfile(profilePayload.data);
      setPosts(postsPayload?.data?.posts || []);
      setHasPendingFollowRequest(nextHasPendingFollowRequest);
    } catch (error) {
      setCurrentUser(null);
      setProfile(null);
      setPosts([]);
      setHasPendingFollowRequest(false);
      setErrorMessage(error.message || "Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRepostPosts() {
    if (!userId) {
      return;
    }

    setIsRepostPostsLoading(true);
    setRepostPostsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/reposts?limit=50`, {
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

  async function handleTabChange(nextTab) {
    setActiveTab(nextTab);

    if (nextTab === "reposts" && !hasLoadedRepostPosts && !isRepostPostsLoading) {
      await fetchRepostPosts();
    }
  }

  async function handleFollowAction() {
    if (isFollowActionLoading) {
      return;
    }

    if (!profile?.id) {
      return;
    }

    if (!currentUser?.id) {
      router.push("/auth/login");
      return;
    }

    setIsFollowActionLoading(true);
    setFollowActionError("");

    const isFollowing = Number(profile.is_following) === 1;
    const isPrivate = !profile.is_public;
    const shouldCancelPendingRequest = isPrivate && !isFollowing && hasPendingFollowRequest;
    const endpoint = isPrivate && !isFollowing ? "/api/follow-requests/" : "/api/follows/";
    const method = isFollowing || shouldCancelPendingRequest ? "DELETE" : "POST";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${profile.id}`, {
        method,
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error ||
            (isFollowing
              ? "Failed to unfollow user"
              : shouldCancelPendingRequest
                ? "Failed to cancel follow request"
                : isPrivate
                  ? "Failed to send follow request"
                  : "Failed to follow user")
        );
      }

      if (shouldCancelPendingRequest) {
        setHasPendingFollowRequest(false);
      } else if (isPrivate && !isFollowing) {
        setHasPendingFollowRequest(true);
      }

      await fetchProfilePage();
    } catch (error) {
      setFollowActionError(error.message || "Failed to update follow status");
    } finally {
      setIsFollowActionLoading(false);
    }
  }

  async function handleBlockUser() {
    if (!profile?.id) {
      return;
    }

    if (!currentUser?.id) {
      router.push("/auth/login");
      return;
    }

    if (isBlockActionLoading) {
      return;
    }

    const displayName = profile.nickname || profile.first_name || "this user";
    if (!window.confirm(`Block ${displayName}?`)) {
      return;
    }

    setIsBlockActionLoading(true);
    setBlockActionError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocks/${profile.id}`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await parseResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to block user");
      }

      router.replace("/posts");
    } catch (error) {
      setBlockActionError(error.message || "Failed to block user");
    } finally {
      setIsBlockActionLoading(false);
    }
  }

  async function fetchConnections(tab) {
    if (!userId) {
      return;
    }

    const endpoint = tab === "followers" ? `/api/followers/${userId}?limit=100` : `/api/following/${userId}?limit=100`;

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

  function handleCloseConnectionsModal() {
    setIsConnectionsModalOpen(false);
    setConnectionsError("");
  }

  useEffect(() => {
    async function loadProfilePage() {
      await fetchProfilePage();
    }

    loadProfilePage();

  }, [router, userId]);

  useEffect(() => {
    setActiveTab("posts");
    setRepostPosts([]);
    setHasLoadedRepostPosts(false);
    setIsRepostPostsLoading(false);
    setRepostPostsError("");
  }, [userId]);

  const followActionLabel = Number(profile?.is_following) === 1
    ? "Unfollow"
    : profile?.is_public
      ? "Follow"
      : hasPendingFollowRequest
        ? "Request sent"
        : "Request follow";
  const canMessage = Boolean(profile) && Number(profile?.is_following) === 1;

  function handleMessageClick() {
    if (!profile?.id) {
      return;
    }

    const params = new URLSearchParams({ userId: profile.id });

    if (profile.first_name) {
      params.set("firstName", profile.first_name);
    }
    if (profile.last_name) {
      params.set("lastName", profile.last_name);
    }
    if (profile.nickname) {
      params.set("nickname", profile.nickname);
    }
    if (profile.avatar_path) {
      params.set("avatar", profile.avatar_path);
    }

    router.push(`/messages?${params.toString()}`);
  }

  return (
    <ProfileView
      profile={profile}
      posts={posts}
      isLoading={isLoading}
      errorMessage={errorMessage}
      isSelf={false}
      titleLabel="User profile"
      onLogin={() => router.push("/auth/login")}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      repostPosts={repostPosts}
      isRepostPostsLoading={isRepostPostsLoading}
      repostPostsError={repostPostsError}
      followActionLabel={followActionLabel}
      onFollowAction={handleFollowAction}
      onMessageClick={handleMessageClick}
      onBlockUser={handleBlockUser}
      canMessage={canMessage}
      isFollowActionLoading={isFollowActionLoading}
      followActionError={followActionError}
      isBlockActionLoading={isBlockActionLoading}
      blockActionError={blockActionError}
      isFollowActionDisabled={false}
      isConnectionsModalOpen={isConnectionsModalOpen}
      activeConnectionsTab={activeConnectionsTab}
      onOpenConnectionsModal={handleOpenConnectionsModal}
      onConnectionsTabChange={handleConnectionsTabChange}
      onCloseConnectionsModal={handleCloseConnectionsModal}
      connections={connectionsByTab[activeConnectionsTab] || []}
      isConnectionsLoading={isConnectionsLoading}
      connectionsError={connectionsError}
      currentUserId={currentUser?.id || ""}
    />
  );
}
