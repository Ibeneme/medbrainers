"use client";

import { Lock, RefreshCw } from "lucide-react";
import GuardedLink from "./guarded-link";
import { useAccess } from "@/hooks/useAccess";
import { LANDING_CANDIDATES } from "@/lib/access/route-access";
import type { Need } from "@/lib/access/permissions";

const label = (need: Need | undefined) =>
  need === null || need === undefined ? "" : (Array.isArray(need) ? need : [need]).join("  or  ");

/** Full-page "you don't have access" screen (used by RouteGuard). */
export function AccessDenied({ need, unmapped }: { need?: Need; unmapped?: boolean }) {
  const { roles, role, canPath, loading } = useAccess();
  const landing = LANDING_CANDIDATES.find((h) => canPath(h));
  const names = roles.length ? roles.map((r) => r.name).join(", ") : role ?? "";

  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(127,127,127,0.25)" }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Lock size={22} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">You don’t have access to this page</h1>
        <p className="mt-2 text-sm opacity-70">
          {unmapped
            ? "This screen hasn’t been assigned an access rule yet, so it is closed by default. Ask an administrator."
            : "Your role doesn’t include the permission needed here. If you think this is a mistake, ask a facility administrator to update your access."}
        </p>
        {!unmapped && need && (
          <p className="mt-3 inline-block rounded-md bg-black/5 px-2.5 py-1 font-mono text-[11px] dark:bg-white/10">
            requires: {label(need)}
          </p>
        )}
        {names && <p className="mt-3 text-xs opacity-60">Your role{roles.length > 1 ? "s" : ""}: {names}</p>}
        <div className="mt-6 flex items-center justify-center gap-2">
          {landing && (
            <GuardedLink
              href={landing}
              className="rounded-full border px-4 py-2 text-xs font-semibold transition hover:opacity-80"
            >
              Go to a page you can use
            </GuardedLink>
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("mb:refresh-access"))}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition hover:opacity-80"
            disabled={loading}
          >
            <RefreshCw size={12} /> Re-check my access
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
