import { headers } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

export async function getAuthenticatedUser() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");

  if (!cookieHeader || !cookieHeader.includes("session_id=")) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      return null;
    }

    return payload.data ?? null;
  } catch {
    return null;
  }
}