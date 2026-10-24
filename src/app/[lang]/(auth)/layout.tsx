import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";

// Account pages should not appear in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Shared layout for /login, /get-started, /forgot-password: reusable left side + form on the right. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
