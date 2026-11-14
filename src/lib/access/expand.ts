import { ALL_PERMISSIONS } from "./permissions";

/** Expand "*" and "module.*" into concrete permissions. */
export function expandPermissions(perms: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const p of perms) {
    if (p === "*") ALL_PERMISSIONS.forEach((x) => out.add(x));
    else if (p.endsWith(".*")) ALL_PERMISSIONS.filter((x) => x.startsWith(p.slice(0, -1))).forEach((x) => out.add(x));
    else out.add(p);
  }
  return out;
}

/** Compact for storing: everything selected → ["*"], otherwise the concrete list. */
export function compactPermissions(selected: Set<string>): string[] {
  if (ALL_PERMISSIONS.every((p) => selected.has(p))) return ["*"];
  return [...selected].sort();
}
