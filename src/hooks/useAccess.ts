"use client";

import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/api/hooks";
import type { AccessInfo } from "@/api/types";
import { hasPermission, satisfies, satisfiesRoute } from "@/lib/access/evaluate";
import type { Need, Permission } from "@/lib/access/permissions";
import { needForPath } from "@/lib/access/route-access";

const SUPER: AccessInfo = {
  role: "super_admin",
  roles: [],
  roleKeys: ["super_admin"],
  isOwner: false,
  isSuperAdmin: true,
  permissions: [],
  directPermissions: [],
  deniedPermissions: [],
  modules: {},
};

/**
 * The one hook every component uses to ask "may this person…?"
 *
 *   const { can, canAny, canPath } = useAccess();
 *   {can("radiology.sign") && <SignButton />}
 *   {canAny(["labs.write", "labs.manage"]) && …}
 *   canPath("/dashboard/pharmacy/dispense")      // same rules as the sidebar / RouteGuard
 *
 * Answers are `false` until the permissions have loaded (`ready`) — never "true by default".
 */
export function useAccess() {
  const facilityId = useAppSelector(
    (s) => s.facilities.activeFacilityId || s.facilities.activeFacility?.id || s.auth.activeFacilityId || "",
  );
  const stored = useAppSelector((s) => (facilityId ? s.access.byFacility[facilityId] : undefined));
  const status = useAppSelector((s) => s.access.status);
  const error = useAppSelector((s) => s.access.error);
  const isSuperUser = useAppSelector((s) => s.auth.user?.role === "super_admin");

  const access: AccessInfo | undefined = stored ?? (isSuperUser ? SUPER : undefined);

  const can = useCallback((perm: Permission | string) => hasPermission(access, perm), [access]);
  const canAny = useCallback((perms: readonly (Permission | string)[]) => perms.some((p) => hasPermission(access, p)), [access]);
  const canAll = useCallback((perms: readonly (Permission | string)[]) => perms.every((p) => hasPermission(access, p)), [access]);
  const canNeed = useCallback((need: Need | undefined) => satisfies(access, need), [access]);

  /** Can this person open this app route? (unmapped /dashboard routes are denied, except for super_admin) */
  const canPath = useCallback(
    (href: string) => {
      const n = needForPath(href);
      if (!n.mapped) return !!access?.isSuperAdmin;
      return satisfiesRoute(access, n);
    },
    [access],
  );

  return useMemo(
    () => ({
      facilityId,
      access,
      ready: !!access,
      loading: !access && status !== "error",
      failed: !access && status === "error",
      error,
      /** primary role key (e.g. "doctor") */
      role: access?.role ?? null,
      /** every role the person holds here */
      roles: access?.roles ?? [],
      permissions: access?.permissions ?? [],
      modules: access?.modules ?? {},
      isOwner: !!access?.isOwner,
      isSuperAdmin: !!access?.isSuperAdmin,
      can,
      canAny,
      canAll,
      canNeed,
      canPath,
      /** Can they see ANY action of this module? (use for menus/cards) */
      hasModule: (module: string) => !!access?.isSuperAdmin || access?.isOwner || (access?.modules?.[module]?.length ?? 0) > 0,
    }),
    [facilityId, access, status, error, can, canAny, canAll, canNeed, canPath],
  );
}

export default useAccess;
