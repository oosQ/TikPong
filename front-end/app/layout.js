import { Suspense } from "react";
import "./globals.css";
import AppShell from "@/app/_components/app-shell";

export const metadata = {
  title: "TikPong",
  description: "TikPong social feed",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Suspense>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
