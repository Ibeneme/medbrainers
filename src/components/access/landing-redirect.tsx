"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/hooks/useAccess";
import { LANDING_CANDIDATES } from "@/lib/access/route-access";

/** /dashboard → the first screen this person is actually allowed to use (not always the overview). */
export default function LandingRedirect() {
  const router = useRouter();
  const { ready, failed, facilityId, canPath } = useAccess();

  useEffect(() => {
    if (!facilityId) return router.replace("/dashboard/dashboard"); // layout guides facility creation
    if (failed) return router.replace("/dashboard/notifications");
    if (!ready) return;
    router.replace(LANDING_CANDIDATES.find((h) => canPath(h)) ?? "/dashboard/notifications");
  }, [ready, failed, facilityId, canPath, router]);

  return <div className="flex min-h-[50vh] items-center justify-center text-sm opacity-60">Loading…</div>;
}
