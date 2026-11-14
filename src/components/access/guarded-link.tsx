"use client";

import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { useAccess } from "@/hooks/useAccess";

type Props = ComponentProps<typeof Link> & {
  /** What to render instead when the person can't open the target (default: nothing) */
  whenDenied?: "hide" | "render";
};

/**
 * Drop-in replacement for next/link inside the dashboard.
 * If the target is a /dashboard route the person is not allowed to open, the link is not rendered —
 * so "New patient", "Edit", "Dispense"… buttons that are links disappear automatically, using the same
 * rule table as the sidebar and the page guard. Links to anything else are untouched.
 */
const GuardedLink = forwardRef<HTMLAnchorElement, Props>(function GuardedLink(
  { href, whenDenied = "hide", ...rest },
  ref,
) {
  const { canPath, ready } = useAccess();
  const target = typeof href === "string" ? href : (href.pathname ?? "");
  const gated = target.includes("/dashboard");
  if (gated && whenDenied === "hide" && ready && !canPath(target)) return null;
  return <Link ref={ref} href={href} {...rest} />;
});

export default GuardedLink;
