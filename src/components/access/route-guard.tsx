"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAccess } from "@/hooks/useAccess";
import { satisfies } from "@/lib/access/evaluate";
import { needForPath } from "@/lib/access/route-access";
import AccessDenied from "./access-denied";

/**
 * PAGE LAYER. Wrap the dashboard content once; every page under /dashboard is checked against
 * lib/access/route-access.ts before it mounts — so a page the person can't use never renders
 * and never fires its data requests.
 */
export default function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const { access, facilityId, loading, failed } = useAccess();

  const n = needForPath(pathname);

  // Open routes (and anything outside /dashboard) never wait on permissions
  if (n.mapped && (n.need === null || (Array.isArray(n.need) && n.need.length === 0))) return <>{children}</>;

  // No facility selected yet: the layout already guides the person to create/pick one
  if (!facilityId) return <>{children}</>;

  if (!access) {
    if (failed) return <AccessDenied need={n.mapped ? n.need : undefined} />;
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm opacity-60" aria-busy={loading}>
        Checking your access…
      </div>
    );
  }

  if (!n.mapped) {
    if (access.isSuperAdmin) return <>{children}</>;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[access] No rule for ${pathname} — add one to src/lib/access/route-access.ts`);
    }
    return <AccessDenied unmapped />;
  }

  return satisfies(access, n.need) ? <>{children}</> : <AccessDenied need={n.need} />;
}
