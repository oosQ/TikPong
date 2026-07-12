import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function AuthLayout({ children }) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/posts");
  }

  return children;
}