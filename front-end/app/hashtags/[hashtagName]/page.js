"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatCount,
  getInitial,
  normalizeImagePath,
} from "@/app/posts/_components/post-card";

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

function renderPostTile(post, options = {}) {
  const href = options.href || `/post/${post.id}`;

  return (
    <Link
      key={post.id}
      href={href}
      onClick={options.onClick}
      className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#111111] transition hover:border-white/20"
    >
      <div className="aspect-[3/4] bg-black">
        {post.image_path ? (
          <img
            src={normalizeImagePath(post.image_path)}
            alt={post.title || post.nickname || post.user_id}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(254,44,85,0.28),transparent_30%),radial-gradient(circle_at_bottom,rgba(37,244,238,0.18),transparent_28%),#0f0f10] p-5 text-center">
            <p className="line-clamp-6 whitespace-pre-wrap text-sm font-medium leading-6 text-white/92 sm:text-base">
              {post.title || post.nickname || "Untitled post"}
              {post.content ? `\n${post.content}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent px-3 pb-3 pt-12">
        <div className="flex items-end justify-between gap-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {post.nickname || post.title || post.user_id || "Post"}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {post.privacy}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            {formatCount(post.total_views)} views
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HashtagPostsPage() {
  const router = useRouter();
  const params = useParams();
  const rawHashtagName = Array.isArray(params?.hashtagName)
    ? params.hashtagName[0]
    : params?.hashtagName;
  const hashtagName = useMemo(() => {
    if (!rawHashtagName) {
      return "";
    }

    try {
      return decodeURIComponent(rawHashtagName);
    } catch {
      return rawHashtagName;
    }
  }, [rawHashtagName]);

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  function handleOpenHashtagPost() {
    try {
      window.sessionStorage.setItem(
        "hashtag-post-viewer",
        JSON.stringify({
          hashtagHref: `/hashtags/${encodeURIComponent(hashtagName)}`,
          hashtagName,
          posts,
        })
      );
    } catch {}
  }

  useEffect(() => {
    let ignore = false;

    async function fetchHashtagPosts() {
      if (!hashtagName) {
        setErrorMessage("Missing hashtag name");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const postsResponse = await fetch(
          `${API_BASE_URL}/api/hashtags/${encodeURIComponent(hashtagName)}/posts?limit=50`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const postsPayload = await parseResponse(postsResponse);

        if (!postsResponse.ok || !postsPayload?.success) {
          throw new Error(postsPayload?.error || "Failed to load hashtag posts");
        }

        if (!ignore) {
          setPosts(postsPayload?.data?.posts || []);
        }
      } catch (error) {
        if (!ignore) {
          setPosts([]);
          setErrorMessage(error.message || "Failed to load hashtag posts");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchHashtagPosts();

    return () => {
      ignore = true;
    };
  }, [hashtagName]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-[24px] border border-white/10 bg-[#111111] text-6xl font-light text-white/35 sm:h-28 sm:w-28">
              #
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {hashtagName ? `#${hashtagName}` : "Hashtag posts"}
              </h1>
              <p className="mt-3 text-sm text-white/60">
                {isLoading ? "Loading posts..." : `${formatCount(posts.length)} posts`}
              </p>
            </div>
          </div>
          <Link
            href="/posts"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back to posts
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            No posts found for this hashtag.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {posts.map((post) =>
              renderPostTile(post, {
                href: `/post/${post.id}?source=hashtag&tag=${encodeURIComponent(hashtagName)}`,
                onClick: handleOpenHashtagPost,
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}