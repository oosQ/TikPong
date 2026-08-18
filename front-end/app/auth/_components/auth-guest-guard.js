"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8433";

export default function AuthGuestGuard({ children }) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (active && response.ok && payload?.success) {
          router.replace("/posts");
          return;
        }
      } catch {
      }

      if (active) setIsCheckingSession(false);
    }

    checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  if (isCheckingSession) {
    return (
      <main className="auth-page text-white" aria-label="Checking your session">
        <span className="auth-button-spinner h-6! w-6!" />
      </main>
    );
  }

  return children;
}
