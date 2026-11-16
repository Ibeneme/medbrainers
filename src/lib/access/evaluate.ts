import type { AccessInfo } from "@/api/types";
import type { Need } from "./permissions";

/** Does this access grant `perm`? Mirrors the server's EffectiveAccess.has(). */
export function hasPermission(access: AccessInfo | null | undefined, perm: string): boolean {
  if (!access) return false;
  if (access.isSuperAdmin) return true;
  const mod = perm.split(".")[0];
  const denied = access.deniedPermissions || [];
  if (denied.includes("*") || denied.includes(perm) || denied.includes(`${mod}.*`)) return false;
  if (access.isOwner) return true;
  return (access.permissions || []).includes(perm);
}

/** Evaluate a Need: null → any signed-in member; array → any-of; string → that permission. */
export function satisfies(access: AccessInfo | null | undefined, need: Need | undefined): boolean {
  if (need === undefined || need === null) return true;
  const list = Array.isArray(need) ? need : [need as string];
  if (list.length === 0) return true;
  return list.some((p) => hasPermission(access, p));
}

/** Role gate: primary role must be listed (owner / super_admin always pass). No list = no restriction. */
export function satisfiesRoles(access: AccessInfo | null | undefined, roles?: readonly string[]): boolean {
  if (!roles || roles.length === 0) return true;
  if (!access) return false;
  return access.isSuperAdmin || access.isOwner || roles.includes(access.role);
}

/** Everything a mapped route requires: its permission(s) AND, where set, its role list. */
export function satisfiesRoute(access: AccessInfo | null | undefined, n: { need: Need; roles?: readonly string[] }): boolean {
  return satisfies(access, n.need) && satisfiesRoles(access, n.roles);
}
