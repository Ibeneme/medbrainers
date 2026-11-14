"use client";

import type { ReactNode } from "react";
import { useAccess } from "@/hooks/useAccess";
import type { Permission } from "@/lib/access/permissions";

interface CanProps {
  /** ANY of these (a single permission or a list) */
  perm?: Permission | readonly Permission[];
  /** ALL of these */
  all?: readonly Permission[];
  /** …or "whatever this app route needs" — e.g. <Can path="/dashboard/patients/register"> */
  path?: string;
  /** shown instead of children when not allowed (default: nothing) */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Show children only if the signed-in person is allowed.
 *
 *   <Can perm="radiology.sign"><SignButton/></Can>
 *   <Can perm={["labs.write","labs.manage"]}>…</Can>      // any-of
 *   <Can all={["data.export","patients.view"]}>…</Can>     // all-of
 *   <Can path={`/dashboard/wards/${id}/beds/new`}>…</Can> // same rule table the router uses
 */
export function Can({ perm, all, path, fallback = null, children }: CanProps) {
  const { canAny, canAll, canPath } = useAccess();
  let ok = true;
  if (perm !== undefined) ok = ok && canAny(Array.isArray(perm) ? perm : [perm as Permission]);
  if (all !== undefined) ok = ok && canAll(all);
  if (path !== undefined) ok = ok && canPath(path);
  return <>{ok ? children : fallback}</>;
}

export default Can;
