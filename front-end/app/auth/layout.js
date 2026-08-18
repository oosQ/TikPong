import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import AuthGuestGuard from "@/app/auth/_components/auth-guest-guard";

export default async function AuthLayout({ children }) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/posts");
  }

  // The client guard covers local/dev setups where the Next.js server cannot
  // reach the backend but the browser still has a valid backend session cookie.
  return <AuthGuestGuard>{children}</AuthGuestGuard>;
}
